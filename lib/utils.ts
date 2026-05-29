// lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Geo Utilities ──────────────────────────────────────────────────

/**
 * Haversine distance between two coordinates in km
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * Format speed in km/h
 */
export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)}`;
}

/**
 * Format ETA in minutes
 */
export function formatETA(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Bearing between two points (0–360 degrees)
 */
export function getBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Cardinal direction from bearing
 */
export function bearingToCardinal(bearing: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(bearing / 45) % 8];
}

// ─── String Utilities ───────────────────────────────────────────────

/**
 * Get initials from display name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Generate a random rider avatar color
 */
export function randomRiderColor(): string {
  const colors = [
    "#00D4FF", // cyan
    "#FF6B00", // orange
    "#00FF88", // green
    "#FF2D55", // red
    "#FFD60A", // yellow
    "#BF5AF2", // purple
    "#FF9F0A", // amber
    "#30D158", // mint
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate a random 6-character invite code
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Time Utilities ─────────────────────────────────────────────────

/**
 * Format duration in seconds to "1h 23m" or "45s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Relative time label
 */
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 10000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ─── Battery & Status ───────────────────────────────────────────────

export function batteryColor(level: number): string {
  if (level > 50) return "#00FF88";
  if (level > 20) return "#FFD60A";
  return "#FF2D55";
}

export function statusColor(status: string): string {
  switch (status) {
    case "riding": return "#00FF88";
    case "stopped": return "#FFD60A";
    case "sos": return "#FF2D55";
    default: return "#606060";
  }
}

// ─── Map Style URLs ─────────────────────────────────────────────────
export const MAP_STYLES = {
  dark: "https://api.maptiler.com/maps/night/style.json?key=" + (process.env.NEXT_PUBLIC_MAPTILER_KEY || "demo"),
  satellite: "https://api.maptiler.com/maps/hybrid/style.json?key=" + (process.env.NEXT_PUBLIC_MAPTILER_KEY || "demo"),
  terrain: "https://api.maptiler.com/maps/outdoor/style.json?key=" + (process.env.NEXT_PUBLIC_MAPTILER_KEY || "demo"),
  // Fallback free style
  fallback: "https://demotiles.maplibre.org/style.json",
};

// ─── POI Categories ─────────────────────────────────────────────────
export const POI_CATEGORIES = [
  { key: "petrol", label: "Fuel", icon: "⛽", color: "#FF9F0A", query: "fuel station petrol pump" },
  { key: "washroom", label: "Washrooms", icon: "🚻", color: "#00D4FF", query: "public toilet washroom" },
  { key: "mechanic", label: "Mechanic", icon: "🔧", color: "#BF5AF2", query: "motorcycle mechanic repair shop" },
  { key: "hospital", label: "Hospital", icon: "🏥", color: "#FF2D55", query: "hospital emergency" },
  { key: "food", label: "Food", icon: "🍽️", color: "#00FF88", query: "restaurant dhaba food" },
  { key: "scenic", label: "Scenic", icon: "📍", color: "#FFD60A", query: "viewpoint scenic spot" },
];