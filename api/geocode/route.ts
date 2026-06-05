// api/geocode/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Per-IP rate limiter (edge-friendly, resets per cold start)
const requestTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 60;
  const timestamps = (requestTimestamps.get(ip) ?? []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  requestTimestamps.set(ip, timestamps);
  return false;
}

const NOMINATIM_HEADERS = {
  "User-Agent": "TempestMaps/1.0 (open-source mapping platform)",
  "Accept-Language": "en",
  "Accept": "application/json",
};

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "forward";
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  // ── Reverse geocoding ──────────────────────────────────────
  if (mode === "reverse") {
    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng are required for reverse geocoding" },
        { status: 400 }
      );
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (
      isNaN(latNum) || isNaN(lngNum) ||
      latNum < -90 || latNum > 90 ||
      lngNum < -180 || lngNum > 180
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const params = new URLSearchParams({
      lat, lon: lng, format: "jsonv2",
      addressdetails: "1", extratags: "1", zoom: "18",
    });

    try {
      const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
        headers: NOMINATIM_HEADERS,
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Reverse geocoding unavailable" },
          { status: 502 }
        );
      }
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    } catch {
      return NextResponse.json({ error: "Geocoding service error" }, { status: 502 });
    }
  }

  // ── Forward geocoding ──────────────────────────────────────
  if (!q?.trim()) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  const trimmed = q.trim();
  if (trimmed.length > 256) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  // XSS guard — reject if query contains HTML
  if (/<[^>]+>/.test(trimmed)) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 12);

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: String(limit),
    dedupe: "1",
  });

  // Optional bias params
  const viewbox = searchParams.get("viewbox");
  if (viewbox) params.set("viewbox", viewbox);
  const countrycodes = searchParams.get("countrycodes");
  if (countrycodes) params.set("countrycodes", countrycodes);

  try {
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: NOMINATIM_HEADERS,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Geocoding service error" }, { status: 502 });
  }
}