// src/hooks/useMapControls.ts
"use client";

import { useCallback } from "react";
import { useMapStore } from "@/store/mapStore";
import { MAP_CONFIG } from "@/lib/map-config";

export function useMapControls() {
  const { mapInstance, viewState, setIs3DMode, is3DMode } = useMapStore();

  const zoomIn = useCallback(() => {
    if (!mapInstance) return;
    const currentZoom = mapInstance.getZoom();
    if (currentZoom < MAP_CONFIG.MAX_ZOOM) {
      mapInstance.zoomTo(currentZoom + MAP_CONFIG.ZOOM_STEP, {
        duration: 200,
      });
    }
  }, [mapInstance]);

  const zoomOut = useCallback(() => {
    if (!mapInstance) return;
    const currentZoom = mapInstance.getZoom();
    if (currentZoom > MAP_CONFIG.MIN_ZOOM) {
      mapInstance.zoomTo(currentZoom - MAP_CONFIG.ZOOM_STEP, {
        duration: 200,
      });
    }
  }, [mapInstance]);

  const resetNorth = useCallback(() => {
    if (!mapInstance) return;
    mapInstance.easeTo({ bearing: 0, duration: 400 });
  }, [mapInstance]);

  const togglePitch = useCallback(() => {
    if (!mapInstance) return;
    const newPitch = is3DMode ? 0 : MAP_CONFIG.PITCH_3D;
    mapInstance.easeTo({ pitch: newPitch, duration: 500 });
    setIs3DMode(!is3DMode);
  }, [mapInstance, is3DMode, setIs3DMode]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  const flyTo = useCallback(
    (lng: number, lat: number, zoom?: number) => {
      if (!mapInstance) return;
      mapInstance.flyTo({
        center: [lng, lat],
        zoom: zoom ?? MAP_CONFIG.DEFAULT_ZOOM,
        duration: MAP_CONFIG.ANIMATION_DURATION,
        essential: true,
      });
    },
    [mapInstance]
  );

  return {
    zoomIn,
    zoomOut,
    resetNorth,
    togglePitch,
    toggleFullscreen,
    flyTo,
    currentZoom: viewState.zoom,
    currentBearing: viewState.bearing,
    isAtMaxZoom: viewState.zoom >= MAP_CONFIG.MAX_ZOOM,
    isAtMinZoom: viewState.zoom <= MAP_CONFIG.MIN_ZOOM,
  };
}