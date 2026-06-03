// src/store/searchStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GeocodingResult } from "@/types/map";

interface SearchState {
  query: string;
  results: GeocodingResult[];
  isSearching: boolean;
  isOpen: boolean;
  selectedResult: GeocodingResult | null;
  recentSearches: GeocodingResult[];
  error: string | null;

  // Actions
  setQuery: (query: string) => void;
  setResults: (results: GeocodingResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedResult: (result: GeocodingResult | null) => void;
  addRecentSearch: (result: GeocodingResult) => void;
  clearRecentSearches: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>()(
  devtools(
    (set) => ({
      query: "",
      results: [],
      isSearching: false,
      isOpen: false,
      selectedResult: null,
      recentSearches: [],
      error: null,

      setQuery: (query) => set({ query }),
      setResults: (results) => set({ results }),
      setIsSearching: (isSearching) => set({ isSearching }),
      setIsOpen: (isOpen) => set({ isOpen }),
      setSelectedResult: (selectedResult) => set({ selectedResult }),
      addRecentSearch: (result) =>
        set((state) => ({
          recentSearches: [
            result,
            ...state.recentSearches
              .filter((r) => r.id !== result.id)
              .slice(0, 9),
          ],
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
      setError: (error) => set({ error }),
      reset: () =>
        set({ query: "", results: [], isSearching: false, error: null }),
    }),
    { name: "tempest-search-store" }
  )
);