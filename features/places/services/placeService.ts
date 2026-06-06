// features/places/services/placeService.ts
import type { PlaceDetails, PlacePhoto, PlaceOpeningHours } from "@/types/place";
import type { GeocodingResult } from "@/types/map";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OVERPASS  = "https://overpass-api.de/api/interpreter";
const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary";

const OSM_HEADERS = {
  "User-Agent": "TempestMaps/1.0 (open-source mapping platform)",
  "Accept-Language": "en",
  "Accept": "application/json",
};

// ─────────────────────────────────────────────────────────────
// Convert a GeocodingResult into richer PlaceDetails via Nominatim lookup
// ─────────────────────────────────────────────────────────────
export async function enrichPlaceDetails(
  base: GeocodingResult
): Promise<PlaceDetails> {
  const osmIdMatch = base.id.match(/^osm-(\d+)$/);
  const nominatimId = osmIdMatch ? parseInt(osmIdMatch[1]) : null;

  // Base shape from the geocoding result
  const place: PlaceDetails = {
    id: base.id,
    name: base.name,
    category: base.category,
    address: base.address,
    coordinates: base.coordinates,
    tags: {},
  };

  if (!nominatimId) return place;

  try {
    // Full Nominatim lookup for extratags
    const params = new URLSearchParams({
      place_id: String(nominatimId),
      format: "jsonv2",
      addressdetails: "1",
      extratags: "1",
      namedetails: "1",
    });

    const res = await fetch(`${NOMINATIM}/details?${params}`, {
      headers: OSM_HEADERS,
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      const extra = data.extratags ?? {};
      const addr  = data.address ?? {};

      place.tags        = extra;
      place.country     = addr.country;
      place.state       = addr.state;
      place.city        = addr.city ?? addr.town ?? addr.village;
      place.postcode    = addr.postcode;
      place.description = extra.description;
      place.wikidata    = extra.wikidata;
      place.wikipedia   = extra.wikipedia;

      place.contact = {
        phone:   extra.phone ?? extra["contact:phone"],
        website: extra.website ?? extra["contact:website"],
        email:   extra.email  ?? extra["contact:email"],
      };

      if (extra.opening_hours) {
        place.openingHours = parseOpeningHours(extra.opening_hours);
      }
    }
  } catch {
    // Non-fatal — return partial data
  }

  // Fetch Wikipedia summary if available
  if (place.wikipedia && !place.description) {
    try {
      const title = place.wikipedia.split(":").pop() ?? place.wikipedia;
      const wikiRes = await fetch(`${WIKI_SUMMARY}/${encodeURIComponent(title)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (wikiRes.ok) {
        const wiki = await wikiRes.json();
        place.description = wiki.extract;
        if (wiki.thumbnail?.source) {
          place.photos = [
            {
              id: "wiki-thumb",
              url: wiki.originalimage?.source ?? wiki.thumbnail.source,
              thumb: wiki.thumbnail.source,
              caption: wiki.title,
            },
          ];
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return place;
}

// ─────────────────────────────────────────────────────────────
// Overpass API — fetch extra OSM node/way data
// ─────────────────────────────────────────────────────────────
export async function fetchOverpassDetails(
  osmType: "node" | "way" | "relation",
  osmId: number
): Promise<Record<string, string>> {
  const type = osmType === "node" ? "node" : osmType === "way" ? "way" : "rel";
  const query = `[out:json];${type}(${osmId});out body;`;

  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return {};
    const data = await res.json();
    return data.elements?.[0]?.tags ?? {};
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────
// Parse OSM opening_hours string into structured data
// ─────────────────────────────────────────────────────────────
function parseOpeningHours(raw: string): PlaceOpeningHours {
  const now   = new Date();
  const day   = now.getDay(); // 0=Sun
  const time  = now.getHours() * 100 + now.getMinutes();

  // Simple check for "24/7"
  if (raw.trim() === "24/7") {
    return {
      openNow: true,
      raw,
      weekdayText: Array(7).fill("Open 24 hours"),
    };
  }

  // Very lightweight human-readable conversion
  const weekdayText = buildWeekdayText(raw);
  const openNow     = estimateOpenNow(raw, day, time);

  return { openNow, raw, weekdayText };
}

function estimateOpenNow(raw: string, day: number, time: number): boolean {
  // "Mo-Fr 09:00-18:00" style patterns only — best-effort
  try {
    const parts = raw.split(";");
    for (const part of parts) {
      const cleaned = part.trim();
      if (!cleaned) continue;
      const timeMatch = cleaned.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (!timeMatch) continue;
      const open  = parseInt(timeMatch[1]) * 100 + parseInt(timeMatch[2]);
      const close = parseInt(timeMatch[3]) * 100 + parseInt(timeMatch[4]);
      if (time >= open && time < close) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

const DAY_MAP: Record<string, number> = {
  Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
};
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildWeekdayText(raw: string): string[] {
  // Fallback: just repeat raw for all days
  return DAY_NAMES.map((d) => `${d}: ${raw}`);
}

// ─────────────────────────────────────────────────────────────
// Mapillary nearby images
// ─────────────────────────────────────────────────────────────
export async function fetchNearbyMapillaryImages(
  lng: number,
  lat: number,
  radius = 100
): Promise<PlacePhoto[]> {
  const token = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;
  if (!token) return [];

  try {
    const params = new URLSearchParams({
      access_token: token,
      fields: "id,thumb_1024_url,thumb_256_url,geometry,captured_at",
      limit: "6",
      bbox: `${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}`,
    });

    const res = await fetch(
      `https://graph.mapillary.com/images?${params}`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data.data ?? []).map((img: MapillaryImage) => ({
      id: img.id,
      url: img.thumb_1024_url ?? img.thumb_256_url,
      thumb: img.thumb_256_url,
      caption: `Captured ${new Date(img.captured_at).toLocaleDateString()}`,
    }));
  } catch {
    return [];
  }
}

interface MapillaryImage {
  id: string;
  thumb_1024_url?: string;
  thumb_256_url?: string;
  captured_at: string;
  geometry?: { coordinates: [number, number] };
}