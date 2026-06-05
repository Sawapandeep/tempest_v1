// src/store/mapStore.ts
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { Map as MapLibreMap } from "maplibre-gl";
import type {
  MapViewState,
  MapLayerType,
  MapMarker,
  UserLocation,
  GeocodingResult,
} from "@/types/map";
import { DEFAULT_VIEW_STATE, DEFAULT_DARK_STYLE } from "@/lib/map-config";

interface MapState {
  // Map instance (not serializable, kept in store for cross-component access)
  mapInstance: MapLibreMap | null;

  // View state
  viewState: MapViewState;

  // Active layer
  activeLayer: MapLayerType;
  activeStyleUrl: string;

  // Theme
  isDarkMode: boolean;

  // User location
  userLocation: UserLocation | null;
  isLocating: boolean;
  locationError: string | null;
  isFollowingUser: boolean;

  // Markers
  markers: MapMarker[];

  // Selected place
  selectedPlace: GeocodingResult | null;

  // UI state
  isFullscreen: boolean;
  is3DMode: boolean;
  isMapLoaded: boolean;

  // Actions
  setMapInstance: (map: MapLibreMap | null) => void;
  setViewState: (viewState: Partial<MapViewState>) => void;
  setActiveLayer: (layer: MapLayerType, styleUrl?: string) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setUserLocation: (location: UserLocation | null) => void;
  setIsLocating: (isLocating: boolean) => void;
  setLocationError: (error: string | null) => void;
  setIsFollowingUser: (following: boolean) => void;
  addMarker: (marker: MapMarker) => void;
  removeMarker: (id: string) => void;
  clearMarkers: () => void;
  setSelectedPlace: (place: GeocodingResult | null) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setIs3DMode: (is3D: boolean) => void;
  setIsMapLoaded: (loaded: boolean) => void;
  flyTo: (center: { lng: number; lat: number }, zoom?: number) => void;
  resetNorth: () => void;
}

export const useMapStore = create<MapState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      mapInstance: null,
      viewState: DEFAULT_VIEW_STATE,
      activeLayer: "standard",
      activeStyleUrl: DEFAULT_DARK_STYLE,
      isDarkMode: true,
      userLocation: null,
      isLocating: false,
      locationError: null,
      isFollowingUser: false,
      markers: [],
      selectedPlace: null,
      isFullscreen: false,
      is3DMode: false,
      isMapLoaded: false,

      // Actions
      setMapInstance: (map) => set({ mapInstance: map }),

      setViewState: (viewState) =>
        set((state) => ({
          viewState: { ...state.viewState, ...viewState },
        })),

      setActiveLayer: (layer, styleUrl) =>
        set({ activeLayer: layer, ...(styleUrl && { activeStyleUrl: styleUrl }) }),

      setIsDarkMode: (isDark) => set({ isDarkMode: isDark }),

      setUserLocation: (location) => set({ userLocation: location }),

      setIsLocating: (isLocating) => set({ isLocating }),

      setLocationError: (error) => set({ locationError: error }),

      setIsFollowingUser: (following) => set({ isFollowingUser: following }),

      addMarker: (marker) =>
        set((state) => ({
          markers: [
            ...state.markers.filter((m) => m.id !== marker.id),
            marker,
          ],
        })),

      removeMarker: (id) =>
        set((state) => ({
          markers: state.markers.filter((m) => m.id !== id),
        })),

      clearMarkers: () => set({ markers: [] }),

      setSelectedPlace: (place) => set({ selectedPlace: place }),

      setIsFullscreen: (isFullscreen) => set({ isFullscreen }),

      setIs3DMode: (is3D) => set({ is3DMode: is3D }),

      setIsMapLoaded: (loaded) => set({ isMapLoaded: loaded }),

      flyTo: (center, zoom) => {
        const { mapInstance } = get();
        if (!mapInstance) return;
        mapInstance.flyTo({
          center: [center.lng, center.lat],
          zoom: zoom ?? mapInstance.getZoom(),
          duration: 800,
          essential: true,
        });
      },

      resetNorth: () => {
        const { mapInstance } = get();
        if (!mapInstance) return;
        mapInstance.easeTo({ bearing: 0, pitch: 0, duration: 500 });
        set((state) => ({
          viewState: { ...state.viewState, bearing: 0, pitch: 0 },
        }));
      },
    })),
    { name: "tempest-map-store" }
  )
);