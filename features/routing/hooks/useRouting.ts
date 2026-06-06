"use client";
// features/routing/hooks/useRouting.ts

import { useCallback, useEffect, useRef } from "react";
import { useRouteStore } from "@/store/routeStore";
import { useMapStore } from "@/store/mapStore";
import { getRoute } from "@/features/routing/services/routingService";
import {
  fitMapToRoute,
} from "@/features/routing/services/routeLayerService";
import type { RouteProfile, RouteWaypoint } from "@/types/routing";
import type { GeocodingResult } from "@/types/map";
import { generateId } from "@/lib/utils";

export function useRouting() {
  const store = useRouteStore();
  const { mapInstance } = useMapStore();
  const abortRef = useRef<AbortController | null>(null);

  /** Core route calculation — called explicitly by the user */
  const calculateRoute = useCallback(async () => {
    const { origin, destination, activeProfile } = useRouteStore.getState();
    if (!origin || !destination) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    store.setIsRouting(true);
    store.setError(null);
    store.setRoutes([]);

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

      // Fit map to the best route
      if (mapInstance && routes[0]) {
        fitMapToRoute(mapInstance, routes[0]);
      }
    } catch (err) {
      const e = err as Error;
      if (e.name !== "AbortError" && e.name !== "TimeoutError") {
        store.setError(e.message ?? "Failed to calculate route");
        store.setRoutes([]);
      }
    } finally {
      store.setIsRouting(false);
    }
  }, [store, mapInstance]);

  /** Re-calculate when user changes transport mode */
  const prevProfile = useRef(store.activeProfile);
  useEffect(() => {
    if (prevProfile.current !== store.activeProfile) {
      prevProfile.current = store.activeProfile;
      if (store.origin && store.destination) {
        calculateRoute();
      }
    }
  });

  /** Fit map when active route index changes */
  useEffect(() => {
    if (!mapInstance || !store.routes.length) return;
    const active = store.routes[store.activeRouteIndex];
    if (active) fitMapToRoute(mapInstance, active);
  }, [store.activeRouteIndex, mapInstance]);

  /* ── waypoint helpers ─────────────────────────────────────── */

  const setOriginFromPlace = useCallback(
    (place: GeocodingResult) => {
      store.setOrigin({
        id: generateId(),
        label: place.name,
        coordinates: place.coordinates,
        type: "origin",
      });
    },
    [store]
  );

  const setDestinationFromPlace = useCallback(
    (place: GeocodingResult) => {
      store.setDestination({
        id: generateId(),
        label: place.name,
        coordinates: place.coordinates,
        type: "destination",
      });
    },
    [store]
  );

  const setOriginFromCoords = useCallback(
    (coords: { lng: number; lat: number }, label = "Origin") => {
      store.setOrigin({ id: generateId(), label, coordinates: coords, type: "origin" });
    },
    [store]
  );

  const setDestinationFromCoords = useCallback(
    (coords: { lng: number; lat: number }, label = "Destination") => {
      store.setDestination({ id: generateId(), label, coordinates: coords, type: "destination" });
    },
    [store]
  );

  const clearAndClose = useCallback(() => {
    abortRef.current?.abort();
    store.clearRoute();
  }, [store]);

  return {
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