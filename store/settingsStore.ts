// src/store/settingsStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Theme, UnitSystem, AppSettings } from "@/types/common";

interface SettingsState extends AppSettings {
  // Actions
  setTheme: (theme: Theme) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setLanguage: (lang: string) => void;
  setDefaultMapLayer: (layer: string) => void;
  setShowTraffic: (show: boolean) => void;
  setShowTransit: (show: boolean) => void;
  setLocationSharingEnabled: (enabled: boolean) => void;
  setSearchHistoryEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  unitSystem: "metric",
  language: "en",
  defaultMapLayer: "standard",
  showTraffic: false,
  showTransit: false,
  locationSharingEnabled: true,
  searchHistoryEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_SETTINGS,

        setTheme: (theme) => set({ theme }),
        setUnitSystem: (unitSystem) => set({ unitSystem }),
        setLanguage: (language) => set({ language }),
        setDefaultMapLayer: (defaultMapLayer) => set({ defaultMapLayer }),
        setShowTraffic: (showTraffic) => set({ showTraffic }),
        setShowTransit: (showTransit) => set({ showTransit }),
        setLocationSharingEnabled: (locationSharingEnabled) =>
          set({ locationSharingEnabled }),
        setSearchHistoryEnabled: (searchHistoryEnabled) =>
          set({ searchHistoryEnabled }),
        resetSettings: () => set(DEFAULT_SETTINGS),
      }),
      {
        name: "tempest-settings",
      }
    ),
    { name: "tempest-settings-store" }
  )
);