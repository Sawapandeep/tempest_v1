// features/search/services/geocodingService.ts
import type { GeocodingResult, Coordinates } from "@/types/map";
import { isWithinIndia, INDIA_BOUNDS } from "@/lib/map-config";

const COORD_RE =
  /^(-?\d{1,3}(?:\.\d+)?)[°\s,]+\s*(-?\d{1,3}(?:\.\d+)?)[°]?(?:\s*[NSns])?(?:\s*[EWew])?$/;

function parseCoordinateQuery(query: string): { lat: number; lng: number } | null {
  const match = query.trim().match(COORD_RE);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

const INDIA_VIEWBOX = `${INDIA_BOUNDS.west},${INDIA_BOUNDS.north},${INDIA_BOUNDS.east},${INDIA_BOUNDS.south}`;

/**
 * Search with India-bounded Nominatim, with automatic fallback:
 * 1. bounded=1 (strict India)
 * 2. bounded=0 + countrycodes=in (relaxed, handles typos better)
 * 3. namedetails + dedupe=0 (broadest)
 */
export async function searchPlaces(
  query: string,
  options: {
    limit?: number;
    viewbox?: string;
    bounded?: boolean;
  } = {}
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Coordinate shortcut
  const coords = parseCoordinateQuery(trimmed);
  if (coords) {
    if (!isWithinIndia(coords.lng, coords.lat)) {
      return [{
        id: "out-of-bounds",
        name: "Location outside India",
        displayName: "This coordinate is outside India",
        category: "Error",
        address: "Tempest Maps covers India only",
        coordinates: coords,
      }];
    }
    return [{
      id: `coord-${coords.lat.toFixed(6)}-${coords.lng.toFixed(6)}`,
      name: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
      displayName: `Coordinates: ${coords.lat.toFixed(6)}°N, ${coords.lng.toFixed(6)}°E`,
      category: "Coordinates",
      address: `${Math.abs(coords.lat).toFixed(6)}°${coords.lat >= 0 ? "N" : "S"}, ${Math.abs(coords.lng).toFixed(6)}°${coords.lng >= 0 ? "E" : "W"}`,
      coordinates: coords,
    }];
  }

  const { limit = 8 } = options;

  // ── Pass 1: bounded India search ─────────────────────────────────────────
  let results = await nominatimSearch(trimmed, limit, true);
  if (results.length > 0) return results;

  // ── Pass 2: unbounded India search (handles spelling variants better) ──
  results = await nominatimSearch(trimmed, limit, false);
  if (results.length > 0) return results;

  // ── Pass 3: If still empty, try a fuzzy prefix match by stripping last word
  //    e.g. "sachpass" → try "sach" which may match "Sach Pass"
  const words = trimmed.split(/\s+/);
  if (words.length === 1 && trimmed.length > 4) {
    const prefix = trimmed.slice(0, Math.ceil(trimmed.length * 0.75));
    results = await nominatimSearch(prefix, limit, false);
    if (results.length > 0) return results;
  }

  return [];
}

async function nominatimSearch(
  q: string,
  limit: number,
  bounded: boolean
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    mode:         "forward",
    q,
    limit:        String(Math.min(limit, 12)),
    bounded:      bounded ? "1" : "0",
  });

  try {
    const res = await fetch(`/api/geocode?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Too many requests — please slow down.");
      throw new Error(`Search failed (${res.status})`);
    }
    const data: NominatimResult[] = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map(nominatimToResult)
      .filter((r) => isWithinIndia(r.coordinates.lng, r.coordinates.lat));
  } catch (err) {
    if ((err as Error).name === "AbortError" || (err as Error).name === "TimeoutError") return [];
    throw err;
  }
}

export async function reverseGeocode(
  coords: Coordinates
): Promise<GeocodingResult | null> {
  if (!isWithinIndia(coords.lng, coords.lat)) return null;

  const params = new URLSearchParams({
    mode: "reverse",
    lat:  String(coords.lat),
    lng:  String(coords.lng),
  });

  try {
    const res = await fetch(`/api/geocode?${params.toString()}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data: NominatimResult & { error?: string } = await res.json();
    if (!data || data.error) return null;
    return nominatimToResult(data);
  } catch {
    return null;
  }
}

export async function lookupPlace(
  osmType: "N" | "W" | "R",
  osmId: number
): Promise<GeocodingResult | null> {
  const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
  const params = new URLSearchParams({
    osm_ids:       `${osmType}${osmId}`,
    format:        "jsonv2",
    addressdetails:"1",
    extratags:     "1",
  });
  try {
    const res = await fetch(`${NOMINATIM_BASE}/lookup?${params.toString()}`, {
      headers: {
        "User-Agent":     "TempestMaps/1.0 (open-source mapping platform)",
        "Accept-Language":"en",
      },
    });
    if (!res.ok) return null;
    const data: NominatimResult[] = await res.json();
    if (!data?.length) return null;
    const result = nominatimToResult(data[0]);
    if (!isWithinIndia(result.coordinates.lng, result.coordinates.lat)) return null;
    return result;
  } catch {
    return null;
  }
}

// ── Types ───────────────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  type?: string;
  category?: string;
  class?: string;
  importance?: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    country_code?: string;
  };
  extratags?: Record<string, string>;
  boundingbox?: [string, string, string, string];
}

function nominatimToResult(item: NominatimResult): GeocodingResult {
  const addr = item.address;
  const shortAddress = [
    addr?.road,
    addr?.suburb ?? addr?.city ?? addr?.town ?? addr?.village,
    addr?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const bbox = item.boundingbox
    ? {
        south: parseFloat(item.boundingbox[0]),
        north: parseFloat(item.boundingbox[1]),
        west:  parseFloat(item.boundingbox[2]),
        east:  parseFloat(item.boundingbox[3]),
      }
    : undefined;

  return {
    id:          `osm-${item.place_id}`,
    name:        item.name || item.display_name.split(",")[0].trim(),
    displayName: item.display_name,
    category:    formatCategory(item.category ?? item.class ?? item.type),
    address:     shortAddress || item.display_name,
    coordinates: {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    },
    bbox,
    confidence: item.importance,
  };
}

function formatCategory(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
//!before landlock

// // features/search/services/geocodingService.ts
// import type { GeocodingResult, Coordinates } from "@/types/map";

// // ---------------------------------------------------------------------------
// // Coordinate pattern: "lat, lng" or "lat lng"
// // Accepts optional degree symbols and N/S/E/W suffixes
// // ---------------------------------------------------------------------------
// const COORD_RE =
//   /^(-?\d{1,3}(?:\.\d+)?)[°\s,]+\s*(-?\d{1,3}(?:\.\d+)?)[°]?(?:\s*[NSns])?(?:\s*[EWew])?$/;

// function parseCoordinateQuery(query: string): { lat: number; lng: number } | null {
//   const match = query.trim().match(COORD_RE);
//   if (!match) return null;
//   const lat = parseFloat(match[1]);
//   const lng = parseFloat(match[2]);
//   if (isNaN(lat) || isNaN(lng)) return null;
//   if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
//   return { lat, lng };
// }

// // ---------------------------------------------------------------------------
// // Forward geocoding — proxied through /api/geocode to avoid CORS & rate limits
// // ---------------------------------------------------------------------------
// export async function searchPlaces(
//   query: string,
//   options: {
//     limit?: number;
//     countrycodes?: string;
//     viewbox?: string;
//     bounded?: boolean;
//   } = {}
// ): Promise<GeocodingResult[]> {
//   const trimmed = query.trim();
//   if (!trimmed) return [];

//   // Fast-path: raw coordinate input
//   const coords = parseCoordinateQuery(trimmed);
//   if (coords) {
//     return [
//       {
//         id: `coord-${coords.lat.toFixed(6)}-${coords.lng.toFixed(6)}`,
//         name: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
//         displayName: `Coordinates: ${coords.lat.toFixed(6)}°, ${coords.lng.toFixed(6)}°`,
//         category: "Coordinates",
//         address: `${Math.abs(coords.lat).toFixed(6)}°${coords.lat >= 0 ? "N" : "S"}, ${Math.abs(coords.lng).toFixed(6)}°${coords.lng >= 0 ? "E" : "W"}`,
//         coordinates: coords,
//       },
//     ];
//   }

//   const { limit = 8, countrycodes, viewbox } = options;

//   const params = new URLSearchParams({
//     mode: "forward",
//     q: trimmed,
//     limit: String(Math.min(limit, 12)),
//   });
//   if (countrycodes) params.set("countrycodes", countrycodes);
//   if (viewbox) params.set("viewbox", viewbox);

//   const res = await fetch(`/api/geocode?${params.toString()}`, {
//     signal: AbortSignal.timeout(10_000),
//   });

//   if (!res.ok) {
//     if (res.status === 429) throw new Error("Too many requests — please slow down.");
//     throw new Error(`Search failed (${res.status})`);
//   }

//   const data: NominatimResult[] = await res.json();
//   if (!Array.isArray(data)) return [];
//   return data.map(nominatimToResult);
// }

// // ---------------------------------------------------------------------------
// // Reverse geocoding
// // ---------------------------------------------------------------------------
// export async function reverseGeocode(
//   coords: Coordinates
// ): Promise<GeocodingResult | null> {
//   const params = new URLSearchParams({
//     mode: "reverse",
//     lat: String(coords.lat),
//     lng: String(coords.lng),
//   });

//   try {
//     const res = await fetch(`/api/geocode?${params.toString()}`, {
//       signal: AbortSignal.timeout(8_000),
//     });
//     if (!res.ok) return null;

//     const data: NominatimResult & { error?: string } = await res.json();
//     if (!data || data.error) return null;

//     return nominatimToResult(data);
//   } catch {
//     return null;
//   }
// }

// // ---------------------------------------------------------------------------
// // OSM Lookup by ID (used for place details in later phases)
// // ---------------------------------------------------------------------------
// export async function lookupPlace(
//   osmType: "N" | "W" | "R",
//   osmId: number
// ): Promise<GeocodingResult | null> {
//   // Direct Nominatim lookup — server-side proxying not needed for this low-frequency call
//   const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
//   const params = new URLSearchParams({
//     osm_ids: `${osmType}${osmId}`,
//     format: "jsonv2",
//     addressdetails: "1",
//     extratags: "1",
//   });

//   try {
//     const res = await fetch(`${NOMINATIM_BASE}/lookup?${params.toString()}`, {
//       headers: {
//         "User-Agent": "TempestMaps/1.0 (open-source mapping platform)",
//         "Accept-Language": "en",
//       },
//     });
//     if (!res.ok) return null;
//     const data: NominatimResult[] = await res.json();
//     if (!data?.length) return null;
//     return nominatimToResult(data[0]);
//   } catch {
//     return null;
//   }
// }

// // ---------------------------------------------------------------------------
// // Types & normalisation
// // ---------------------------------------------------------------------------
// interface NominatimResult {
//   place_id: number;
//   osm_type?: string;
//   osm_id?: number;
//   lat: string;
//   lon: string;
//   name?: string;
//   display_name: string;
//   type?: string;
//   category?: string;
//   class?: string;
//   importance?: number;
//   address?: {
//     house_number?: string;
//     road?: string;
//     suburb?: string;
//     city?: string;
//     town?: string;
//     village?: string;
//     county?: string;
//     state?: string;
//     country?: string;
//     postcode?: string;
//     country_code?: string;
//   };
//   extratags?: {
//     website?: string;
//     phone?: string;
//     opening_hours?: string;
//     email?: string;
//     brand?: string;
//   };
//   boundingbox?: [string, string, string, string];
// }

// function nominatimToResult(item: NominatimResult): GeocodingResult {
//   const addr = item.address;

//   const shortAddress = [
//     addr?.road,
//     addr?.suburb ?? addr?.city ?? addr?.town ?? addr?.village,
//     addr?.state,
//     addr?.country,
//   ]
//     .filter(Boolean)
//     .join(", ");

//   const bbox = item.boundingbox
//     ? {
//         south: parseFloat(item.boundingbox[0]),
//         north: parseFloat(item.boundingbox[1]),
//         west: parseFloat(item.boundingbox[2]),
//         east: parseFloat(item.boundingbox[3]),
//       }
//     : undefined;

//   return {
//     id: `osm-${item.place_id}`,
//     name: item.name || item.display_name.split(",")[0].trim(),
//     displayName: item.display_name,
//     category: formatCategory(item.category ?? item.class ?? item.type),
//     address: shortAddress || item.display_name,
//     coordinates: {
//       lat: parseFloat(item.lat),
//       lng: parseFloat(item.lon),
//     },
//     bbox,
//     confidence: item.importance,
//   };
// }

// function formatCategory(raw?: string): string | undefined {
//   if (!raw) return undefined;
//   return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
// }