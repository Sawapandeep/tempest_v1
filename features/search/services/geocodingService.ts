// src/features/search/services/geocodingService.ts

import type { GeocodingResult, Coordinates } from "@/types/map";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const HEADERS = {
  "Accept-Language": "en",
  "User-Agent": "TempestMaps/1.0 (open-source mapping platform)",
};

/**
 * Forward geocoding — text → coordinates
 */
export async function searchPlaces(
  query: string,
  options: {
    limit?: number;
    countrycodes?: string;
    viewbox?: string;
    bounded?: boolean;
  } = {}
): Promise<GeocodingResult[]> {
  const { limit = 8, countrycodes, viewbox, bounded } = options;

  if (!query.trim()) return [];

  // Detect coordinate input like "40.7128, -74.0060" or "40.7128 -74.0060"
  const coordMatch = query.match(
    /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/
  );
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [
        {
          id: `coord-${lat}-${lng}`,
          name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          displayName: `Coordinates: ${lat.toFixed(6)}°, ${lng.toFixed(6)}°`,
          category: "coordinates",
          address: `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`,
          coordinates: { lat, lng },
        },
      ];
    }
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: String(limit),
    dedupe: "1",
  });

  if (countrycodes) params.set("countrycodes", countrycodes);
  if (viewbox) params.set("viewbox", viewbox);
  if (bounded) params.set("bounded", "1");

  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?${params.toString()}`,
      {
        headers: HEADERS,
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

    const data: NominatimResult[] = await res.json();
    return data.map(nominatimToResult);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Search timed out");
    }
    throw err;
  }
}

/**
 * Reverse geocoding — coordinates → address
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lng),
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    zoom: "18",
  });

  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?${params.toString()}`,
      {
        headers: HEADERS,
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;

    const data: NominatimResult = await res.json();
    if (!data || (data as { error?: string }).error) return null;

    return nominatimToResult(data);
  } catch {
    return null;
  }
}

/**
 * Get place details by OSM type+id
 */
export async function lookupPlace(
  osmType: "N" | "W" | "R",
  osmId: number
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    osm_ids: `${osmType}${osmId}`,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
  });

  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/lookup?${params.toString()}`,
      { headers: HEADERS }
    );
    if (!res.ok) return null;

    const data: NominatimResult[] = await res.json();
    if (!data?.length) return null;

    return nominatimToResult(data[0]);
  } catch {
    return null;
  }
}

// ─── Nominatim types ──────────────────────────────────────────

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
  extratags?: {
    website?: string;
    phone?: string;
    opening_hours?: string;
    email?: string;
    brand?: string;
  };
  boundingbox?: [string, string, string, string]; // [minlat, maxlat, minlon, maxlon]
}

function nominatimToResult(item: NominatimResult): GeocodingResult {
  const addr = item.address;
  const shortAddress = [
    addr?.road,
    addr?.suburb ?? addr?.city ?? addr?.town ?? addr?.village,
    addr?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const bbox = item.boundingbox
    ? {
        south: parseFloat(item.boundingbox[0]),
        north: parseFloat(item.boundingbox[1]),
        west: parseFloat(item.boundingbox[2]),
        east: parseFloat(item.boundingbox[3]),
      }
    : undefined;

  return {
    id: `osm-${item.place_id}`,
    name: item.name || item.display_name.split(",")[0],
    displayName: item.display_name,
    category: formatCategory(item.category ?? item.class ?? item.type),
    address: shortAddress || item.display_name,
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