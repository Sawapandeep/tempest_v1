// features/routing/services/routeLayerService.ts

import type { Map as MapLibreMap } from "maplibre-gl";
import type { Route, RouteProfile } from "@/types/routing";

export const ROUTE_SOURCE_ID = "tempest-route-source";
export const ROUTE_LAYER_OUTLINE = "tempest-route-outline";
export const ROUTE_LAYER_LINE = "tempest-route-line";
export const ROUTE_LAYER_ALT_PREFIX = "tempest-route-alt-";
export const ROUTE_SOURCE_ALT_PREFIX = "tempest-route-alt-source-";
const MAX_ALTERNATIVES = 5;

const PROFILE_COLORS: Record<RouteProfile, { line: string; outline: string; alt: string }> = {
  driving:    { line: "#2a9ff0", outline: "#0968b0", alt: "#64748b" },
  walking:    { line: "#10b981", outline: "#059669", alt: "#64748b" },
  cycling:    { line: "#f59e0b", outline: "#d97706", alt: "#64748b" },
  motorcycle: { line: "#8b5cf6", outline: "#7c3aed", alt: "#64748b" },
  bus:        { line: "#ec4899", outline: "#db2777", alt: "#64748b" },
};

/** Safely add a source only if it doesn't already exist */
function safeAddSource(
  map: MapLibreMap,
  id: string,
  data: GeoJSON.Feature | GeoJSON.FeatureCollection
) {
  if (!map.getSource(id)) {
    map.addSource(id, { type: "geojson", data });
  } else {
    (map.getSource(id) as maplibregl.GeoJSONSource).setData(data);
  }
}

/** Safely add a layer only if it doesn't already exist */
function safeAddLayer(map: MapLibreMap, layer: maplibregl.LayerSpecification) {
  if (!map.getLayer(layer.id)) {
    map.addLayer(layer);
  }
}

export function addRouteLayer(
  map: MapLibreMap,
  routes: Route[],
  activeIndex: number
): void {
  if (!map.isStyleLoaded()) return;

  removeRouteLayer(map);
  if (!routes.length) return;

  const profile = routes[activeIndex]?.profile ?? "driving";
  const colors = PROFILE_COLORS[profile] ?? PROFILE_COLORS.driving;

  // Draw alternative routes first (so they sit below the active)
  routes.forEach((route, idx) => {
    if (idx === activeIndex) return;
    const sourceId = `${ROUTE_SOURCE_ALT_PREFIX}${idx}`;
    const layerId = `${ROUTE_LAYER_ALT_PREFIX}${idx}`;

    safeAddSource(map, sourceId, {
      type: "Feature",
      properties: { routeIndex: idx },
      geometry: route.geometry,
    });

    safeAddLayer(map, {
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.alt,
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 3, 14, 5, 18, 7] as maplibregl.DataDrivenPropertyValueSpecification<number>,
        "line-opacity": 0.5,
        "line-dasharray": [2, 3],
      },
    });
  });

  // Draw active route on top
  const active = routes[activeIndex];
  if (!active) return;

  safeAddSource(map, ROUTE_SOURCE_ID, {
    type: "Feature",
    properties: { profile },
    geometry: active.geometry,
  });

  // Outline (halo)
  safeAddLayer(map, {
    id: ROUTE_LAYER_OUTLINE,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": colors.outline,
      "line-width": ["interpolate", ["linear"], ["zoom"], 8, 6, 14, 10, 18, 14] as maplibregl.DataDrivenPropertyValueSpecification<number>,
      "line-opacity": 0.65,
    },
  });

  // Line
  safeAddLayer(map, {
    id: ROUTE_LAYER_LINE,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": colors.line,
      "line-width": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 7, 18, 10] as maplibregl.DataDrivenPropertyValueSpecification<number>,
      "line-opacity": 1,
    },
  });
}

export function removeRouteLayer(map: MapLibreMap): void {
  if (!map.isStyleLoaded()) return;

  for (const id of [ROUTE_LAYER_LINE, ROUTE_LAYER_OUTLINE]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

  for (let i = 0; i < MAX_ALTERNATIVES; i++) {
    const layerId = `${ROUTE_LAYER_ALT_PREFIX}${i}`;
    const sourceId = `${ROUTE_SOURCE_ALT_PREFIX}${i}`;
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
}

export function updateActiveRoute(
  map: MapLibreMap,
  routes: Route[],
  activeIndex: number
): void {
  addRouteLayer(map, routes, activeIndex);
}

export function fitMapToRoute(
  map: MapLibreMap,
  route: Route,
  padding = { top: 80, bottom: 280, left: 80, right: 80 }
): void {
  if (!route.bbox) return;
  map.fitBounds(
    [
      [route.bbox.west, route.bbox.south],
      [route.bbox.east, route.bbox.north],
    ],
    { padding, duration: 800, essential: true }
  );
}