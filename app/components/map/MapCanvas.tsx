"use client";
// app/components/map/MapCanvas.tsx

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/mapStore";
import { useSettingsStore } from "@/store/settingsStore";
import {
  DEFAULT_VIEW_STATE,
  DEFAULT_DARK_STYLE,
  DEFAULT_LIGHT_STYLE,
  MAP_CONFIG,
} from "@/lib/map-config";
import { UserLocationMarker } from "@/app/components/map/UserLocationMarker";

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const {
    setMapInstance,
    setViewState,
    setIsMapLoaded,
    activeStyleUrl,
    userLocation,
    isFollowingUser,
  } = useMapStore();

  const theme = useSettingsStore((s) => s.theme);

  const resolveStyle = useCallback(() => {
    if (activeStyleUrl) return activeStyleUrl;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    return isDark ? DEFAULT_DARK_STYLE : DEFAULT_LIGHT_STYLE;
  }, [activeStyleUrl, theme]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const style = resolveStyle();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [DEFAULT_VIEW_STATE.center.lng, DEFAULT_VIEW_STATE.center.lat],
      zoom: DEFAULT_VIEW_STATE.zoom,
      bearing: DEFAULT_VIEW_STATE.bearing,
      pitch: DEFAULT_VIEW_STATE.pitch,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      attributionControl: {
        compact: true,
        customAttribution: MAP_CONFIG.ATTRIBUTION,
      },
      fadeDuration: 150,
      renderWorldCopies: true,
    });

    mapRef.current = map;
    setMapInstance(map);

    map.on("load", () => {
      setIsMapLoaded(true);
    });

    map.on("move", () => {
      const center = map.getCenter();
      setViewState({
        center: { lng: center.lng, lat: center.lat },
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    // Track fullscreen state
    const handleFullscreen = () => {
      useMapStore.getState().setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreen);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      setIsMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update style when layer/theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const style = resolveStyle();
    map.setStyle(style);
  }, [activeStyleUrl, resolveStyle]);

  // Follow user location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || !isFollowingUser) return;
    map.easeTo({
      center: [userLocation.coordinates.lng, userLocation.coordinates.lat],
      duration: 500,
    });
  }, [userLocation, isFollowingUser]);

  return (
    <div className="absolute inset-0 w-full h-full" aria-label="Interactive map">
      <div ref={containerRef} className="w-full h-full" />
      {/* Overlay markers rendered via React portals into the map */}
      <UserLocationMarker />
    </div>
  );
}