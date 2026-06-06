// features/routing/services/routingService.ts
import type {
  Route,
  RouteProfile,
  RouteRequest,
  RouteResponse,
  RouteManeuver,
  RouteSummary,
} from "@/types/routing";
import type { Coordinates } from "@/types/map";
import { generateId } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Profile configs
// ---------------------------------------------------------------------------

const VALHALLA_COSTING: Record<RouteProfile, string> = {
  driving:    "auto",
  walking:    "pedestrian",
  cycling:    "bicycle",
  motorcycle: "motorcycle",
  bus:        "bus",
};

// Public Valhalla demo endpoint (rate-limited, for dev/demo use)
const VALHALLA_BASE =
  process.env.NEXT_PUBLIC_VALHALLA_URL ??
  "https://valhalla1.openstreetmap.de";

// OSRM public demo (fallback)
const OSRM_BASE = "https://router.project-osrm.org";

// ---------------------------------------------------------------------------
// Main routing function
// ---------------------------------------------------------------------------

export async function getRoute(req: RouteRequest): Promise<Route[]> {
  try {
    return await valhallaRoute(req);
  } catch (err) {
    console.warn("[routing] Valhalla failed, falling back to OSRM:", err);
    // OSRM only supports driving, walking, cycling
    const osrmProfile =
      req.profile === "walking"
        ? "foot"
        : req.profile === "cycling"
        ? "bike"
        : "car";
    return osrmRoute(req, osrmProfile);
  }
}

// ---------------------------------------------------------------------------
// Valhalla
// ---------------------------------------------------------------------------

async function valhallaRoute(req: RouteRequest): Promise<Route[]> {
  const costing = VALHALLA_COSTING[req.profile] ?? "auto";

  const locations = [
    { lon: req.origin.lng, lat: req.origin.lat, type: "break" },
    ...(req.waypoints ?? []).map((w) => ({
      lon: w.lng,
      lat: w.lat,
      type: "through" as const,
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
    signal: AbortSignal.timeout(15_000),
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
      return { auto: { use_highways: 1, use_tolls: 1, use_ferry: 0.5 } };
    case "pedestrian":
      return { pedestrian: { walking_speed: 5.1, use_ferry: 0.5, use_living_streets: 0.6 } };
    case "bicycle":
      return { bicycle: { cycling_speed: 20, use_roads: 0.5, use_hills: 0.5 } };
    default:
      return {};
  }
}

function parseValhallaResponse(data: ValhallaResponse, profile: RouteProfile): Route[] {
  const trips = data.alternates
    ? [data.trip, ...data.alternates.map((a) => a.trip)]
    : [data.trip];

  return trips
    .filter(Boolean)
    .map((trip, idx) => parseValhallaTrip(trip, profile, idx));
}

function parseValhallaTrip(trip: ValhallaTrip, profile: RouteProfile, idx: number): Route {
  const maneuvers: RouteManeuver[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  const coordinates: [number, number][] = [];

  for (const leg of trip.legs) {
    totalDistance += leg.summary.length * 1000; // km → m
    totalDuration += leg.summary.time;

    // Decode the polyline6 shape
    const legCoords = decodePolyline(leg.shape, 6);
    if (coordinates.length === 0) {
      coordinates.push(...legCoords);
    } else {
      coordinates.push(...legCoords.slice(1)); // skip duplicate junction point
    }

    for (const m of leg.maneuvers) {
      const shapeIdx = m.begin_shape_index;
      const coord = legCoords[shapeIdx] ?? legCoords[0];
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

  // Compute bbox
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return {
    id: `route-${idx}-${generateId()}`,
    profile,
    distance: totalDistance,
    duration: totalDuration,
    geometry: {
      type: "LineString",
      coordinates,
    },
    maneuvers,
    bbox: {
      west: minLng,
      east: maxLng,
      south: minLat,
      north: maxLat,
    },
    summary: {
      distance: totalDistance,
      duration: totalDuration,
      hasToll,
      hasFerry,
    },
  };
}

// ---------------------------------------------------------------------------
// OSRM fallback
// ---------------------------------------------------------------------------

async function osrmRoute(
  req: RouteRequest,
  osrmProfile: string
): Promise<Route[]> {
  const coords = [
    req.origin,
    ...(req.waypoints ?? []),
    req.destination,
  ]
    .map((c) => `${c.lng},${c.lat}`)
    .join(";");

  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "true",
    alternatives: req.alternatives ? "true" : "false",
    annotations: "false",
  });

  const url = `${OSRM_BASE}/route/v1/${osrmProfile}/${coords}?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });

  if (!res.ok || res.status !== 200) {
    throw new Error(`OSRM error ${res.status}`);
  }

  const data: OsrmResponse = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No route found");
  }

  return data.routes.map((r, idx) => parseOsrmRoute(r, req.profile, idx));
}

function parseOsrmRoute(
  r: OsrmRoute,
  profile: RouteProfile,
  idx: number
): Route {
  const maneuvers: RouteManeuver[] = [];

  for (const leg of r.legs) {
    for (const step of leg.steps) {
      maneuvers.push({
        instruction: buildOsrmInstruction(step),
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
        location: {
          lng: step.maneuver.location[0],
          lat: step.maneuver.location[1],
        },
        distance: step.distance,
        duration: step.duration,
        streetName: step.name || undefined,
      });
    }
  }

  const coords = r.geometry.coordinates as [number, number][];
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return {
    id: `route-${idx}-${generateId()}`,
    profile,
    distance: r.distance,
    duration: r.duration,
    geometry: r.geometry,
    maneuvers,
    bbox: { west: minLng, east: maxLng, south: minLat, north: maxLat },
    summary: { distance: r.distance, duration: r.duration },
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

// ---------------------------------------------------------------------------
// Polyline decoder (Valhalla uses precision=6)
// ---------------------------------------------------------------------------

function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = Math.pow(10, precision);
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0, shift = 0, b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0; shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lng / factor, lat / factor]);
  }

  return coords;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
    bearing_after?: number;
    bearing_before?: number;
  };
  geometry: GeoJSON.LineString;
}