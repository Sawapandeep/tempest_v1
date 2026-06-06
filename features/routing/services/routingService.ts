// features/routing/services/routingService.ts
import type {
  Route,
  RouteProfile,
  RouteRequest,
  RouteManeuver,
  RouteSummary,
} from "@/types/routing";
import type { Coordinates } from "@/types/map";
import { generateId } from "@/lib/utils";

// ─── Valhalla costing map ─────────────────────────────────────────────────────
const VALHALLA_COSTING: Record<RouteProfile, string> = {
  driving:    "auto",
  walking:    "pedestrian",
  cycling:    "bicycle",
  motorcycle: "motorcycle",
  bus:        "bus",
};

// ─── Realistic average speeds (km/h) used for OSRM post-processing ───────────
// These mirror what Google Maps uses for India (traffic-adjusted averages)
const ROAD_SPEEDS: Record<string, number> = {
  motorway:       90,   // NH expressways
  trunk:          70,   // major NHs
  primary:        60,   // state highways / NHs in hilly terrain
  secondary:      45,
  tertiary:       35,
  unclassified:   25,
  residential:    25,
  service:        20,
  track:          15,
  path:           10,
  cycleway:       15,
  footway:        5,
  steps:          2,
};

// Speed multipliers per profile (relative to car baseline)
const PROFILE_SPEED_FACTOR: Record<RouteProfile, number> = {
  driving:    1.0,
  motorcycle: 0.90,   // slightly slower than car on highways; faster on mountain roads
  cycling:    0.25,   // ~15 km/h avg
  walking:    0.07,   // ~5 km/h
  bus:        0.75,
};

const VALHALLA_BASE =
  process.env.NEXT_PUBLIC_VALHALLA_URL ?? "https://valhalla1.openstreetmap.de";
const OSRM_BASE = "https://router.project-osrm.org";

// ─── Public entry point ───────────────────────────────────────────────────────
export async function getRoute(req: RouteRequest): Promise<Route[]> {
  try {
    const routes = await valhallaRoute(req);
    // Sanity-check: if estimated speed < 5 km/h for motor modes, something is wrong
    const avgSpeed = routes[0]
      ? (routes[0].distance / 1000) / (routes[0].duration / 3600)
      : 99;
    if (
      (req.profile === "driving" || req.profile === "motorcycle") &&
      avgSpeed < 5 &&
      routes[0]?.distance > 10_000
    ) {
      throw new Error("Valhalla speed implausible, falling back to OSRM");
    }
    return routes;
  } catch (err) {
    console.warn("[routing] Valhalla failed, falling back to OSRM:", err);
    const osrmProfile =
      req.profile === "walking"
        ? "foot"
        : req.profile === "driving"
        ? "bike"
        : "car";
    return osrmRoute(req, osrmProfile);
  }
}

// ─── Valhalla ─────────────────────────────────────────────────────────────────
async function valhallaRoute(req: RouteRequest): Promise<Route[]> {
  const costing = VALHALLA_COSTING[req.profile] ?? "auto";

  const locations = [
    { lon: req.origin.lng, lat: req.origin.lat, type: "break" },
    ...(req.waypoints ?? []).map((w) => ({
      lon: w.lng, lat: w.lat, type: "through" as const,
    })),
    { lon: req.destination.lng, lat: req.destination.lat, type: "break" },
  ];

  const body = {
    locations,
    costing,
    costing_options: buildCostingOptions(costing),
    directions_options: {
      units: req.units ?? "km",
      language: req.language ?? "en-US",
      narrative: true,
    },
    alternates: req.alternatives ? 2 : 0,
  };

  const res = await fetch(`${VALHALLA_BASE}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Valhalla error ${res.status}: ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  return parseValhallaResponse(data, req.profile);
}

// Realistic costing options tuned for Indian road conditions
function buildCostingOptions(costing: string): Record<string, unknown> {
  switch (costing) {
    case "auto":
      return {
        auto: {
          use_highways: 1.0,
          use_tolls: 0.5,
          use_ferry: 0.3,
          top_speed: 100,          // km/h cap
          use_living_streets: 0.5,
          // Speed table aligns with Indian NH average speeds
          speed_types: ["freeflow", "constrained", "predicted", "current"],
        },
      };

    case "motorcycle":
      return {
        motorcycle: {
          use_highways: 1.0,
          use_tolls: 0.5,
          use_ferry: 0.3,
          top_speed: 100,
          use_living_streets: 0.8,
          use_trails: 0.5,
          // Motorcycles navigate mountain roads efficiently
          use_hills: 0.8,
        },
      };

    case "pedestrian":
      return {
        pedestrian: {
          walking_speed: 5.1,     // km/h – standard walking pace
          use_ferry: 0.5,
          use_living_streets: 0.8,
          max_hiking_difficulty: 3,
        },
      };

    case "bicycle":
      return {
        bicycle: {
          cycling_speed: 16.0,    // km/h – realistic Indian cycling pace
          use_roads: 0.5,
          use_hills: 0.3,
          use_ferry: 0.3,
          avoid_bad_surfaces: 0.5,
        },
      };

    case "bus":
      return {
        bus: {
          use_highways: 0.8,
          top_speed: 80,
        },
      };

    default:
      return {};
  }
}

// ─── Valhalla response parsing ────────────────────────────────────────────────
function parseValhallaResponse(data: ValhallaResponse, profile: RouteProfile): Route[] {
  const trips = data.alternates
    ? [data.trip, ...data.alternates.map((a) => a.trip)]
    : [data.trip];

  return trips.filter(Boolean).map((trip, idx) => parseValhallaTrip(trip, profile, idx));
}

function parseValhallaTrip(trip: ValhallaTrip, profile: RouteProfile, idx: number): Route {
  const maneuvers: RouteManeuver[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  const coordinates: [number, number][] = [];

  for (const leg of trip.legs) {
    totalDistance += leg.summary.length * 1000;  // km → m
    totalDuration += leg.summary.time;            // seconds

    const legCoords = decodePolyline(leg.shape, 6);
    if (coordinates.length === 0) {
      coordinates.push(...legCoords);
    } else {
      coordinates.push(...legCoords.slice(1));
    }

    for (const m of leg.maneuvers) {
      const coord = legCoords[m.begin_shape_index] ?? legCoords[0];
      maneuvers.push({
        instruction: m.instruction,
        type: m.type.toString(),
        modifier: undefined,
        location: { lng: coord[0], lat: coord[1] },
        distance: m.length * 1000,
        duration: m.time,
        streetName: m.street_names?.join(", "),
        verbalPreTransitionInstruction: m.verbal_pre_transition_instruction,
        verbalPostTransitionInstruction: m.verbal_post_transition_instruction,
        verbalTransitionAlertInstruction: m.verbal_transition_alert_instruction,
      });
    }
  }

  const hasToll = maneuvers.some(
    (m) => m.type === "7" || m.instruction.toLowerCase().includes("toll")
  );
  const hasFerry = maneuvers.some(
    (m) => m.type === "17" || m.instruction.toLowerCase().includes("ferry")
  );

  const bbox = computeBbox(coordinates);

  return {
    id: `route-${idx}-${generateId()}`,
    profile,
    distance: totalDistance,
    duration: totalDuration,
    geometry: { type: "LineString", coordinates },
    maneuvers,
    bbox,
    summary: { distance: totalDistance, duration: totalDuration, hasToll, hasFerry },
  };
}

// ─── OSRM fallback ────────────────────────────────────────────────────────────
async function osrmRoute(req: RouteRequest, osrmProfile: string): Promise<Route[]> {
  const coords = [req.origin, ...(req.waypoints ?? []), req.destination]
    .map((c) => `${c.lng},${c.lat}`)
    .join(";");

  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "true",
    alternatives: req.alternatives ? "true" : "false",
    annotations: "false",
  });

  const res = await fetch(
    `${OSRM_BASE}/route/v1/${osrmProfile}/${coords}?${params}`,
    { signal: AbortSignal.timeout(15_000) }
  );

  if (!res.ok) throw new Error(`OSRM error ${res.status}`);

  const data: OsrmResponse = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");

  return data.routes.map((r, idx) =>
    parseOsrmRoute(r, req.profile, idx)
  );
}

function parseOsrmRoute(r: OsrmRoute, profile: RouteProfile, idx: number): Route {
  const maneuvers: RouteManeuver[] = [];

  // Re-compute duration using realistic speed profiles instead of OSRM defaults
  let adjustedDuration = 0;

  for (const leg of r.legs) {
    for (const step of leg.steps) {
      // Get road class speed
      const baseSpeed = ROAD_SPEEDS[step.name?.toLowerCase()] ?? 40; // default 40 km/h
      const profileFactor = PROFILE_SPEED_FACTOR[profile] ?? 1.0;
      const effectiveSpeed = baseSpeed * profileFactor; // km/h

      // Recalculate step duration from distance + speed
      const stepDistKm = step.distance / 1000;
      const stepDurationSec = (stepDistKm / effectiveSpeed) * 3600;
      adjustedDuration += stepDurationSec;

      maneuvers.push({
        instruction: buildOsrmInstruction(step),
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
        location: { lng: step.maneuver.location[0], lat: step.maneuver.location[1] },
        distance: step.distance,
        duration: stepDurationSec,
        streetName: step.name || undefined,
      });
    }
  }

  // If our recalculated duration is wildly different from OSRM's, blend them
  // OSRM is accurate for distances but its speed model may differ from India reality
  const osrmDuration = r.duration;
  const blended = profile === "cycling" || profile === "walking"
    ? osrmDuration   // OSRM is fine for slow modes
    : Math.min(osrmDuration * 1.15, adjustedDuration); // add 15% buffer for Indian traffic

  const coords = r.geometry.coordinates as [number, number][];

  return {
    id: `route-${idx}-${generateId()}`,
    profile,
    distance: r.distance,
    duration: Math.round(blended),
    geometry: r.geometry,
    maneuvers,
    bbox: computeBbox(coords),
    summary: { distance: r.distance, duration: Math.round(blended) },
  };
}

function buildOsrmInstruction(step: OsrmStep): string {
  const m = step.maneuver;
  const name = step.name ? ` onto ${step.name}` : "";
  switch (m.type) {
    case "depart":     return `Head ${m.modifier ?? ""}${name}`;
    case "arrive":     return "Arrive at destination";
    case "turn":       return `Turn ${m.modifier ?? ""}${name}`;
    case "merge":      return `Merge${name}`;
    case "on ramp":    return `Take the on-ramp${name}`;
    case "off ramp":   return `Take the off-ramp${name}`;
    case "fork":       return `Keep ${m.modifier ?? ""}${name}`;
    case "roundabout": return `At the roundabout, take exit ${m.exit ?? 1}${name}`;
    case "ferry":      return `Board the ferry${name}`;
    case "continue":   return `Continue${name}`;
    default:           return `${m.type}${name}`;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function computeBbox(coordinates: [number, number][]) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { west: minLng, east: maxLng, south: minLat, north: maxLat };
}

function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = Math.pow(10, precision);
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let result = 0, shift = 0, b: number;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0; shift = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lng / factor, lat / factor]);
  }
  return coords;
}

// ─── Type definitions ─────────────────────────────────────────────────────────
interface ValhallaResponse {
  trip: ValhallaTrip;
  alternates?: Array<{ trip: ValhallaTrip }>;
}
interface ValhallaTrip {
  legs: ValhallaLeg[];
  summary: { length: number; time: number };
  status: number;
  status_message: string;
  units: string;
  language: string;
}
interface ValhallaLeg {
  shape: string;
  summary: { length: number; time: number; min_lat: number; min_lon: number; max_lat: number; max_lon: number };
  maneuvers: ValhallaManeuver[];
}
interface ValhallaManeuver {
  type: number;
  instruction: string;
  verbal_pre_transition_instruction?: string;
  verbal_post_transition_instruction?: string;
  verbal_transition_alert_instruction?: string;
  street_names?: string[];
  length: number;
  time: number;
  begin_shape_index: number;
  end_shape_index: number;
  toll?: boolean;
  ferry?: boolean;
}
interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
  waypoints: Array<{ name: string; location: [number, number] }>;
}
interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
  legs: OsrmLeg[];
}
interface OsrmLeg {
  distance: number;
  duration: number;
  summary: string;
  steps: OsrmStep[];
}
interface OsrmStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
    exit?: number;
  };
  geometry: GeoJSON.LineString;
}