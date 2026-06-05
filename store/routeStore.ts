// src/store/routeStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Route, RouteProfile, Coordinates } from "@/types/map";

interface RouteState {
  origin: Coordinates | null;
  destination: Coordinates | null;
  originLabel: string;
  destinationLabel: string;
  activeProfile: RouteProfile;
  routes: Route[];
  activeRouteIndex: number;
  isRouting: boolean;
  error: string | null;
  isVisible: boolean;

  // Actions
  setOrigin: (coords: Coordinates | null, label?: string) => void;
  setDestination: (coords: Coordinates | null, label?: string) => void;
  setActiveProfile: (profile: RouteProfile) => void;
  setRoutes: (routes: Route[]) => void;
  setActiveRouteIndex: (index: number) => void;
  setIsRouting: (isRouting: boolean) => void;
  setError: (error: string | null) => void;
  setIsVisible: (visible: boolean) => void;
  clearRoute: () => void;
  swapOriginDestination: () => void;
}

export const useRouteStore = create<RouteState>()(
  devtools(
    (set) => ({
      origin: null,
      destination: null,
      originLabel: "",
      destinationLabel: "",
      activeProfile: "driving",
      routes: [],
      activeRouteIndex: 0,
      isRouting: false,
      error: null,
      isVisible: false,

      setOrigin: (coords, label = "") =>
        set({ origin: coords, originLabel: label }),
      setDestination: (coords, label = "") =>
        set({ destination: coords, destinationLabel: label }),
      setActiveProfile: (activeProfile) => set({ activeProfile }),
      setRoutes: (routes) => set({ routes }),
      setActiveRouteIndex: (activeRouteIndex) => set({ activeRouteIndex }),
      setIsRouting: (isRouting) => set({ isRouting }),
      setError: (error) => set({ error }),
      setIsVisible: (isVisible) => set({ isVisible }),
      clearRoute: () =>
        set({
          origin: null,
          destination: null,
          originLabel: "",
          destinationLabel: "",
          routes: [],
          activeRouteIndex: 0,
          error: null,
          isVisible: false,
        }),
      swapOriginDestination: () =>
        set((state) => ({
          origin: state.destination,
          destination: state.origin,
          originLabel: state.destinationLabel,
          destinationLabel: state.originLabel,
        })),
    }),
    { name: "tempest-route-store" }
  )
);