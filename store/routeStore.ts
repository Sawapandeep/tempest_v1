// store/routeStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  Route,
  RouteProfile,
  RouteWaypoint,
  RouteRequest,
} from "@/types/routing";
import type { Coordinates } from "@/types/map";

interface RouteState {
  // Waypoints
  origin: RouteWaypoint | null;
  destination: RouteWaypoint | null;
  intermediateWaypoints: RouteWaypoint[];

  // Route data
  routes: Route[];
  activeRouteIndex: number;
  activeRoute: Route | null;

  // UI state
  activeProfile: RouteProfile;
  isRouting: boolean;
  isVisible: boolean;
  error: string | null;

  // Active navigation step
  activeStepIndex: number;
  isNavigating: boolean;

  // Panel state
  isPanelOpen: boolean;
  isPanelExpanded: boolean;

  // Actions
  setOrigin: (waypoint: RouteWaypoint | null) => void;
  setDestination: (waypoint: RouteWaypoint | null) => void;
  addWaypoint: (waypoint: RouteWaypoint) => void;
  removeWaypoint: (id: string) => void;
  swapOriginDestination: () => void;
  setActiveProfile: (profile: RouteProfile) => void;
  setRoutes: (routes: Route[]) => void;
  setActiveRouteIndex: (index: number) => void;
  setIsRouting: (isRouting: boolean) => void;
  setError: (error: string | null) => void;
  setIsVisible: (visible: boolean) => void;
  setActiveStepIndex: (index: number) => void;
  setIsNavigating: (navigating: boolean) => void;
  setIsPanelOpen: (open: boolean) => void;
  setIsPanelExpanded: (expanded: boolean) => void;
  clearRoute: () => void;
  openPanel: () => void;
}

export const useRouteStore = create<RouteState>()(
  devtools(
    (set, get) => ({
      origin: null,
      destination: null,
      intermediateWaypoints: [],
      routes: [],
      activeRouteIndex: 0,
      activeRoute: null,
      activeProfile: "driving",
      isRouting: false,
      isVisible: false,
      error: null,
      activeStepIndex: 0,
      isNavigating: false,
      isPanelOpen: false,
      isPanelExpanded: false,

      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      addWaypoint: (waypoint) =>
        set((state) => ({
          intermediateWaypoints: [...state.intermediateWaypoints, waypoint],
        })),
      removeWaypoint: (id) =>
        set((state) => ({
          intermediateWaypoints: state.intermediateWaypoints.filter(
            (w) => w.id !== id
          ),
        })),
      swapOriginDestination: () =>
        set((state) => ({
          origin: state.destination,
          destination: state.origin,
        })),
      setActiveProfile: (activeProfile) => set({ activeProfile }),
      setRoutes: (routes) =>
        set({
          routes,
          activeRoute: routes[0] ?? null,
          activeRouteIndex: 0,
        }),
      setActiveRouteIndex: (activeRouteIndex) =>
        set((state) => ({
          activeRouteIndex,
          activeRoute: state.routes[activeRouteIndex] ?? null,
        })),
      setIsRouting: (isRouting) => set({ isRouting }),
      setError: (error) => set({ error }),
      setIsVisible: (isVisible) => set({ isVisible }),
      setActiveStepIndex: (activeStepIndex) => set({ activeStepIndex }),
      setIsNavigating: (isNavigating) => set({ isNavigating }),
      setIsPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
      setIsPanelExpanded: (isPanelExpanded) => set({ isPanelExpanded }),
      openPanel: () => set({ isPanelOpen: true, isVisible: true }),
      clearRoute: () =>
        set({
          origin: null,
          destination: null,
          intermediateWaypoints: [],
          routes: [],
          activeRoute: null,
          activeRouteIndex: 0,
          error: null,
          isVisible: false,
          isPanelOpen: false,
          isPanelExpanded: false,
          isNavigating: false,
          activeStepIndex: 0,
        }),
    }),
    { name: "tempest-route-store" }
  )
);