// store/placeStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PlaceDetails, PlaceLoadState, PlaceDetailsState } from "@/types/place";

export const usePlaceStore = create<PlaceDetailsState>()(
  devtools(
    (set) => ({
      details: null,
      loadState: "idle",
      error: null,

      setDetails: (details) => set({ details }),
      setLoadState: (loadState) => set({ loadState }),
      setError: (error) => set({ error }),
      reset: () => set({ details: null, loadState: "idle", error: null }),
    }),
    { name: "tempest-place-store" }
  )
);