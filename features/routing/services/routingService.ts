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

const VALHALLA_COSTING: Record<RouteProfile, string> = {
  driving:    "auto",
  walking:    "pedestrian",
  cycling:    "bicycle",
  motorcycle: "motorcycle",
  bus:        "bus",
};

const ROAD_SPEEDS: Record<string, number> = {
  motorway:       90,
  trunk:          70,
  primary:        60,
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

const PROFILE_SPEED_FACTOR: Record<RouteProfile, number> = {
  driving:    1.0,
  motorcycle: 0.90,
  cycling:    0.25,
  walking:    0.07,
  bus:        0.75,
};

const VALHALLA_BASE =
  process.env.NEXT_PUBLIC_VALHALLA_URL ?? "https://valhalla1.openstreetmap.de";
const OSRM_BASE = "https://router.project-osrm.org";

// Max single-leg distance for Valhalla (metres) — ~200 km avoids provider limits
const MAX_LEG_DISTANCE_M = 200_000;

// ── Haversine helper ─────────────────────────────────────────────────────────
function haversine(a: Coordinates, b: Coordinates): number {
  const R    = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Split waypoints into legs ≤ MAX_LEG_DISTANCE_M
function splitIntoLegs(
  origin: Coordinates,
  destination: Coordinates,
  waypoints: Coordinates[]
): Array<[Coordinates, Coordinates]> {
  const all = [origin, ...waypoints, destination];
  const legs: Array<[Coordinates, Coordinates]> = [];

  let segStart = 0;
  for (let i = 1; i < all.length; i++) {
    const segDist = haversine(all[segStart], all[i]);
    if (segDist > MAX_LEG_DISTANCE_M || i === all.length - 1) {
      // If this single jump itself is huge, split further by linear interpolation
      if (haversine(all[Math.max(segStart, i - 1)], all[i]) > MAX_LEG_DISTANCE_M) {
        // Add a midpoint leg
        const mid: Coordinates = {
          lat: (all[i - 1].lat + all[i].lat) / 2,
          lng: (all[i - 1].lng + all[i].lng) / 2,
        };
        legs.push([all[i - 1], mid]);
        legs.push([mid, all[i]]);
      } else {
        legs.push([all[segStart], all[i]]);
      }
      segStart = i;
    }
  }

  return legs.length ? legs : [[origin, destination]];
}

// Merge multiple leg routes into one combined route
function mergeRoutes(legRoutes: Route[], profile: RouteProfile): Route {
  const combined: Route = {
    id:       `route-merged-${generateId()}`,
    profile,
    distance: 0,
    duration: 0,
    geometry: { type: "LineString", coordinates: [] },
    maneuvers: [],
    summary:  { distance: 0, duration: 0 },
  };

  for (const leg of legRoutes) {
    combined.distance += leg.distance;
    combined.duration += leg.duration;
    if (combined.summary) {
      combined.summary.distance += leg.distance;
      combined.summary.duration += leg.duration;
      if (leg.summary?.hasToll)  combined.summary.hasToll  = true;
      if (leg.summary?.hasFerry) combined.summary.hasFerry = true;
    }

    const coords = leg.geometry.coordinates as [number, number][];
    if (combined.geometry.coordinates.length === 0) {
      (combined.geometry.coordinates as [number, number][]).push(...coords);
    } else {
      (combined.geometry.coordinates as [number, number][]).push(...coords.slice(1));
    }

    combined.maneuvers.push(...leg.maneuvers);
  }

  combined.bbox = computeBbox(combined.geometry.coordinates as [number, number][]);
  return combined;
}

export async function getRoute(req: RouteRequest): Promise<Route[]> {
  const dist = haversine(req.origin, req.destination);

  // Short route — attempt single Valhalla request with OSRM fallback
  if (dist <= MAX_LEG_DISTANCE_M) {
    try {
      const routes = await valhallaRoute(req);
      return routes;
    } catch (err) {
      console.warn("[routing] Valhalla failed, falling back to OSRM:", err);
      const osrmProfile =
        req.profile === "walking"  ? "foot"  :
        req.profile === "cycling"  ? "bike"  : "car";
      return osrmRoute(req, osrmProfile);
    }
  }

  // Long route — split into legs, route each, merge
  console.info(`[routing] Long route ${(dist / 1000).toFixed(0)} km — splitting into legs`);
  const legs = splitIntoLegs(req.origin, req.destination, req.waypoints ?? []);

  const legRoutes: Route[] = [];
  for (const [from, to] of legs) {
    const legReq: RouteRequest = {
      ...req,
      origin:       from,
      destination:  to,
      waypoints:    [],
      alternatives: false,
    };
    try {
      const [r] = await valhallaRoute(legReq);
      if (r) legRoutes.push(r);
    } catch {
      try {
        const osrmProfile =
          req.profile === "walking" ? "foot" :
          req.profile === "cycling" ? "bike" : "car";
        const [r] = await osrmRoute(legReq, osrmProfile);
        if (r) legRoutes.push(r);
      } catch (e2) {
        console.error("[routing] Both engines failed for leg:", e2);
      }
    }
  }

  if (!legRoutes.length) throw new Error("No route found between origin and destination.");

  return [mergeRoutes(legRoutes, req.profile)];
}

// ── Valhalla ─────────────────────────────────────────────────────────────────
async function valhallaRoute(req: RouteRequest): Promise<Route[]> {
  const costing = VALHALLA_COSTING[req.profile] ?? "auto";
  const locations = [
    { lon: req.origin.lng,      lat: req.origin.lat,      type: "break" },
    ...(req.waypoints ?? []).map((w) => ({ lon: w.lng, lat: w.lat, type: "through" as const })),
    { lon: req.destination.lng, lat: req.destination.lat, type: "break" },
  ];

  const body = {
    locations,
    costing,
    costing_options:    buildCostingOptions(costing),
    directions_options: {
      units:     req.units ?? "km",
      language:  req.language ?? "en-US",
      narrative: true,
    },
    alternates: req.alternatives ? 2 : 0,
  };

  const res = await fetch(`${VALHALLA_BASE}/route`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Valhalla error ${res.status}: ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  return parseValhallaResponse(data, req.profile);
}

function buildCostingOptions(costing: string): Record<string, unknown> {
  switch (costing) {
    case "auto":
      return {
        auto: {
          use_highways: 1.0, use_tolls: 0.5, use_ferry: 0.3,
          top_speed: 100, use_living_streets: 0.5,
          speed_types: ["freeflow", "constrained", "predicted", "current"],
        },
      };
    case "motorcycle":
      return {
        motorcycle: {
          use_highways: 1.0, use_tolls: 0.5, use_ferry: 0.3,
          top_speed: 100, use_living_streets: 0.8, use_trails: 0.5, use_hills: 0.8,
        },
      };
    case "pedestrian":
      return {
        pedestrian: {
          walking_speed: 5.1, use_ferry: 0.5, use_living_streets: 0.8, max_hiking_difficulty: 3,
        },
      };
    case "bicycle":
      return {
        bicycle: {
          cycling_speed: 16.0, use_roads: 0.5, use_hills: 0.3, use_ferry: 0.3, avoid_bad_surfaces: 0.5,
        },
      };
    case "bus":
      return { bus: { use_highways: 0.8, top_speed: 80 } };
    default:
      return {};
  }
}

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
    totalDistance += leg.summary.length * 1000;
    totalDuration += leg.summary.time;
    const legCoords = decodePolyline(leg.shape, 6);
    if (coordinates.length === 0) {
      coordinates.push(...legCoords);
    } else {
      coordinates.push(...legCoords.slice(1));
    }
    for (const m of leg.maneuvers) {
      const coord = legCoords[m.begin_shape_index] ?? legCoords[0];
      maneuvers.push({
        instruction:                       m.instruction,
        type:                              m.type.toString(),
        modifier:                          undefined,
        location:                          { lng: coord[0], lat: coord[1] },
        distance:                          m.length * 1000,
        duration:                          m.time,
        streetName:                        m.street_names?.join(", "),
        verbalPreTransitionInstruction:    m.verbal_pre_transition_instruction,
        verbalPostTransitionInstruction:   m.verbal_post_transition_instruction,
        verbalTransitionAlertInstruction:  m.verbal_transition_alert_instruction,
      });
    }
  }

  const hasToll  = maneuvers.some((m) => m.type === "7"  || m.instruction.toLowerCase().includes("toll"));
  const hasFerry = maneuvers.some((m) => m.type === "17" || m.instruction.toLowerCase().includes("ferry"));
  const bbox     = computeBbox(coordinates);

  return {
    id:        `route-${idx}-${generateId()}`,
    profile,
    distance:  totalDistance,
    duration:  totalDuration,
    geometry:  { type: "LineString", coordinates },
    maneuvers,
    bbox,
    summary:   { distance: totalDistance, duration: totalDuration, hasToll, hasFerry },
  };
}

// ── OSRM fallback ────────────────────────────────────────────────────────────
async function osrmRoute(req: RouteRequest, osrmProfile: string): Promise<Route[]> {
  const coords = [req.origin, ...(req.waypoints ?? []), req.destination]
    .map((c) => `${c.lng},${c.lat}`)
    .join(";");
  const params = new URLSearchParams({
    overview:     "full",
    geometries:   "geojson",
    steps:        "true",
    alternatives: req.alternatives ? "true" : "false",
    annotations:  "false",
  });
  const res = await fetch(`${OSRM_BASE}/route/v1/${osrmProfile}/${coords}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`OSRM error ${res.status}`);
  const data: OsrmResponse = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");
  return data.routes.map((r, idx) => parseOsrmRoute(r, req.profile, idx));
}

function parseOsrmRoute(r: OsrmRoute, profile: RouteProfile, idx: number): Route {
  const maneuvers: RouteManeuver[] = [];
  let adjustedDuration = 0;

  for (const leg of r.legs) {
    for (const step of leg.steps) {
      const baseSpeed    = ROAD_SPEEDS[step.name?.toLowerCase()] ?? 40;
      const factor       = PROFILE_SPEED_FACTOR[profile] ?? 1.0;
      const effectiveSpd = baseSpeed * factor;
      const stepDurSec   = ((step.distance / 1000) / effectiveSpd) * 3600;
      adjustedDuration  += stepDurSec;
      maneuvers.push({
        instruction: buildOsrmInstruction(step),
        type:        step.maneuver.type,
        modifier:    step.maneuver.modifier,
        location:    { lng: step.maneuver.location[0], lat: step.maneuver.location[1] },
        distance:    step.distance,
        duration:    stepDurSec,
        streetName:  step.name || undefined,
      });
    }
  }

  const blended = profile === "cycling" || profile === "walking"
    ? r.duration
    : Math.min(r.duration * 1.15, adjustedDuration);

  const coords = r.geometry.coordinates as [number, number][];
  return {
    id:        `route-${idx}-${generateId()}`,
    profile,
    distance:  r.distance,
    duration:  Math.round(blended),
    geometry:  r.geometry,
    maneuvers,
    bbox:      computeBbox(coords),
    summary:   { distance: r.distance, duration: Math.round(blended) },
  };
}

function buildOsrmInstruction(step: OsrmStep): string {
  const m    = step.maneuver;
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

// ── Internal types ───────────────────────────────────────────────────────────
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
  maneuver: { type: string; modifier?: string; location: [number, number]; exit?: number };
  geometry: GeoJSON.LineString;
}