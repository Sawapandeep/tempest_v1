// lib/map-config.ts
import type { MapLayer, MapStyle, MapViewState } from "@/types/map";

// ─── India bounding box ───────────────────────────────────────────────────────
// Covers mainland India + Andaman & Nicobar + Lakshadweep with small padding
export const INDIA_BOUNDS = {
  west:  68.0,
  east:  97.5,
  south:  6.5,
  north: 37.5,
} as const;

// Clamp any coordinate to India bounds
export function clampToIndia(lng: number, lat: number): { lng: number; lat: number } {
  return {
    lng: Math.min(Math.max(lng, INDIA_BOUNDS.west),  INDIA_BOUNDS.east),
    lat: Math.min(Math.max(lat, INDIA_BOUNDS.south), INDIA_BOUNDS.north),
  };
}

export function isWithinIndia(lng: number, lat: number): boolean {
  return (
    lng >= INDIA_BOUNDS.west  &&
    lng <= INDIA_BOUNDS.east  &&
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north
  );
}

// ─── Default view — center of India ──────────────────────────────────────────
export const DEFAULT_VIEW_STATE: MapViewState = {
  center: { lng: 78.9629, lat: 22.5937 }, // geographic center of India
  zoom: 5,
  bearing: 0,
  pitch: 0,
};

export const MAP_STYLES: Record<string, MapStyle> = {
  standard: {
    id: "standard",
    name: "Standard",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  standard_light: {
    id: "standard_light",
    name: "Standard Light",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  voyager: {
    id: "voyager",
    name: "Voyager",
    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  },
};

export const DEFAULT_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
export const DEFAULT_LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
export const VOYAGER_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export const MAP_LAYERS: MapLayer[] = [
  {
    id: "standard",
    label: "Standard",
    icon: "Map",
    available: true,
    styleUrl: DEFAULT_DARK_STYLE,
  },
  {
    id: "terrain",
    label: "Terrain",
    icon: "Mountain",
    available: true,
    styleUrl: VOYAGER_STYLE,
  },
  {
    id: "satellite",
    label: "Satellite",
    icon: "Satellite",
    available: false,
  },
  {
    id: "traffic",
    label: "Traffic",
    icon: "Car",
    available: false,
  },
  {
    id: "transit",
    label: "Transit",
    icon: "Train",
    available: false,
  },
];

export const MAP_CONFIG = {
  MIN_ZOOM: 4,              // don't zoom out beyond India being visible
  MAX_ZOOM: 22,
  ZOOM_STEP: 1,
  DEFAULT_ZOOM: 14,
  GEOLOCATION_ZOOM: 16,
  ANIMATION_DURATION: 500,
  PITCH_3D: 45,
  // Lock viewport to India
  MAX_BOUNDS: [
    [INDIA_BOUNDS.west  - 1, INDIA_BOUNDS.south - 1],   // SW corner with padding
    [INDIA_BOUNDS.east  + 1, INDIA_BOUNDS.north + 1],   // NE corner with padding
  ] as [[number, number], [number, number]],
  ATTRIBUTION:
    "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors © <a href='https://carto.com/attributions'>CARTO</a>",
} as const;

export const TILE_PROVIDERS = {
  OSM:           "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  CARTO_DARK:    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  CARTO_LIGHT:   "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  CARTO_VOYAGER: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
} as const;
//! before landlock
// // lib/map-config.ts
// import type { MapLayer, MapStyle, MapViewState } from "@/types/map";

// // Default view: India (center of the country)
// export const DEFAULT_VIEW_STATE: MapViewState = {
//   center: { lng: 78.9629, lat: 20.5937 },
//   zoom: 5,
//   bearing: 0,
//   pitch: 0,
// };

// export const MAP_STYLES: Record<string, MapStyle> = {
//   standard: {
//     id: "standard",
//     name: "Standard",
//     url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
//   },
//   standard_light: {
//     id: "standard_light",
//     name: "Standard Light",
//     url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
//   },
//   voyager: {
//     id: "voyager",
//     name: "Voyager",
//     url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
//   },
// };

// export const DEFAULT_DARK_STYLE =
//   "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
// export const DEFAULT_LIGHT_STYLE =
//   "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
// export const VOYAGER_STYLE =
//   "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// export const MAP_LAYERS: MapLayer[] = [
//   {
//     id: "standard",
//     label: "Standard",
//     icon: "Map",
//     available: true,
//     styleUrl: DEFAULT_DARK_STYLE,
//   },
//   {
//     id: "terrain",
//     label: "Terrain",
//     icon: "Mountain",
//     available: true,
//     styleUrl: VOYAGER_STYLE,
//   },
//   {
//     id: "satellite",
//     label: "Satellite",
//     icon: "Satellite",
//     available: false,
//   },
//   {
//     id: "traffic",
//     label: "Traffic",
//     icon: "Car",
//     available: false,
//   },
//   {
//     id: "transit",
//     label: "Transit",
//     icon: "Train",
//     available: false,
//   },
// ];

// export const MAP_CONFIG = {
//   MIN_ZOOM: 1,
//   MAX_ZOOM: 22,
//   ZOOM_STEP: 1,
//   DEFAULT_ZOOM: 14,
//   GEOLOCATION_ZOOM: 16,
//   ANIMATION_DURATION: 500,
//   PITCH_3D: 45,
//   ATTRIBUTION:
//     "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors © <a href='https://carto.com/attributions'>CARTO</a>",
// } as const;

// export const TILE_PROVIDERS = {
//   OSM: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
//   CARTO_DARK:    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
//   CARTO_LIGHT:   "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
//   CARTO_VOYAGER: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
// } as const;