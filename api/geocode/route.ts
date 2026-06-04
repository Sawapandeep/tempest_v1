// src/app/api/geocode/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Simple in-memory rate limiter for edge (per-instance, per-request)
const requestTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute window
  const maxRequests = 60;

  const timestamps = (requestTimestamps.get(ip) ?? []).filter(
    (t) => now - t < windowMs
  );

  if (timestamps.length >= maxRequests) return true;

  timestamps.push(now);
  requestTimestamps.set(ip, timestamps);
  return false;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const mode = searchParams.get("mode") ?? "forward"; // "forward" | "reverse"

  // Input validation
  if (mode === "reverse") {
    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng are required for reverse geocoding" },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      lat, lon: lng, format: "jsonv2", addressdetails: "1", zoom: "18",
    });

    const upstream = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        "User-Agent": "TempestMaps/1.0",
        "Accept-Language": "en",
      },
    });

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  }

  // Forward geocoding
  if (!q?.trim()) {
    return NextResponse.json(
      { error: "q parameter is required" },
      { status: 400 }
    );
  }

  if (q.length > 256) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const params = new URLSearchParams({
    q: q.trim(),
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    limit: "8",
    dedupe: "1",
  });

  const upstream = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      "User-Agent": "TempestMaps/1.0",
      "Accept-Language": "en",
    },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Geocoding service unavailable" },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}