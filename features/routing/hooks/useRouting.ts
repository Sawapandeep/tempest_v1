// features/routing/hooks/useRouting.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouteStore } from "@/store/routeStore";
import { useMapStore } from "@/store/mapStore";
import { getRoute } from "@/features/routing/services/routingService";
import {
  addRouteLayer,
  removeRouteLayer,
  fitMapToRoute,
  updateActiveRoute,
} from "@/features/routing/services/routeLayerService";
import type { RouteProfile, RouteWaypoint } from "@/types/routing";
import type { GeocodingResult } from "@/types/map";
import { generateId } from "@/lib/utils";

export function useRouting() {
  const store = useRouteStore();
  const { mapInstance } = useMapStore();
  const routingRef = useRef<AbortController | null>(null);

  // --------------------------------------------------------------------------
  // Derive a route whenever origin/destination/profile change
  // --------------------------------------------------------------------------
  const calculateRoute = useCallback(async () => {
    const { origin, destination, activeProfile } = useRouteStore.getState();
    if (!origin || !destination) return;

    routingRef.current?.abort();
    routingRef.current = new AbortController();

    store.setIsRouting(true);
    store.setError(null);

    try {
      const routes = await getRoute({
        origin: origin.coordinates,
        destination: destination.coordinates,
        waypoints: store.intermediateWaypoints.map((w) => w.coordinates),
        profile: activeProfile,
        alternatives: true,
        units: "km",
      });

      store.setRoutes(routes);
      store.setIsVisible(true);
      store.setIsPanelOpen(true);

      // Render on map
      if (mapInstance) {
        addRouteLayer(mapInstance, routes, 0);
        if (routes[0]) fitMapToRoute(mapInstance, routes[0]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        store.setError((err as Error).message ?? "Failed to calculate route");
        store.setRoutes([]);
      }
    } finally {
      store.setIsRouting(false);
    }
  }, [store, mapInstance]);

  // --------------------------------------------------------------------------
  // Auto-recalculate when profile changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (store.origin && store.destination) {
      calculateRoute();
    }
  }, [store.activeProfile]);

  // --------------------------------------------------------------------------
  // Re-render route on map instance changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstance || !store.routes.length || !store.isVisible) return;

    const onStyleLoad = () => {
      addRouteLayer(mapInstance, store.routes, store.activeRouteIndex);
    };

    if (mapInstance.isStyleLoaded()) {
      onStyleLoad();
    } else {
      mapInstance.once("styledata", onStyleLoad);
    }

    return () => {
      mapInstance.off("styledata", onStyleLoad);
    };
  }, [mapInstance]);

  // --------------------------------------------------------------------------
  // Sync active route index → map
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstance || !store.routes.length) return;
    updateActiveRoute(mapInstance, store.routes, store.activeRouteIndex);
    if (store.routes[store.activeRouteIndex]) {
      fitMapToRoute(mapInstance, store.routes[store.activeRouteIndex]!);
    }
  }, [store.activeRouteIndex, mapInstance]);

  // --------------------------------------------------------------------------
  // Cleanup on clear
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!store.isVisible && mapInstance) {
      removeRouteLayer(mapInstance);
    }
  }, [store.isVisible, mapInstance]);

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------
  const setOriginFromPlace = useCallback(
    (place: GeocodingResult) => {
      const wp: RouteWaypoint = {
        id: generateId(),
        label: place.name,
        coordinates: place.coordinates,
        type: "origin",
      };
      store.setOrigin(wp);
    },
    [store]
  );

  const setDestinationFromPlace = useCallback(
    (place: GeocodingResult) => {
      const wp: RouteWaypoint = {
        id: generateId(),
        label: place.name,
        coordinates: place.coordinates,
        type: "destination",
      };
      store.setDestination(wp);
    },
    [store]
  );

  const setOriginFromCoords = useCallback(
    (coords: { lng: number; lat: number }, label = "Origin") => {
      const wp: RouteWaypoint = {
        id: generateId(),
        label,
        coordinates: coords,
        type: "origin",
      };
      store.setOrigin(wp);
    },
    [store]
  );

  const setDestinationFromCoords = useCallback(
    (coords: { lng: number; lat: number }, label = "Destination") => {
      const wp: RouteWaypoint = {
        id: generateId(),
        label,
        coordinates: coords,
        type: "destination",
      };
      store.setDestination(wp);
    },
    [store]
  );

  const clearAndClose = useCallback(() => {
    store.clearRoute();
    if (mapInstance) removeRouteLayer(mapInstance);
  }, [store, mapInstance]);

  return {
    // State
    origin: store.origin,
    destination: store.destination,
    routes: store.routes,
    activeRoute: store.activeRoute,
    activeRouteIndex: store.activeRouteIndex,
    activeProfile: store.activeProfile,
    isRouting: store.isRouting,
    isVisible: store.isVisible,
    error: store.error,
    isPanelOpen: store.isPanelOpen,
    isPanelExpanded: store.isPanelExpanded,
    activeStepIndex: store.activeStepIndex,

    // Actions
    calculateRoute,
    setOriginFromPlace,
    setDestinationFromPlace,
    setOriginFromCoords,
    setDestinationFromCoords,
    setProfile: store.setActiveProfile,
    setActiveRouteIndex: store.setActiveRouteIndex,
    setActiveStepIndex: store.setActiveStepIndex,
    clearRoute: clearAndClose,
    swapWaypoints: store.swapOriginDestination,
    setIsPanelExpanded: store.setIsPanelExpanded,
    setIsPanelOpen: store.setIsPanelOpen,
    openPanel: store.openPanel,
  };
}