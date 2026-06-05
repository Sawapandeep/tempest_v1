"use client";
// features/search/hooks/useSearch.ts

import { useCallback, useEffect, useRef } from "react";
import { useSearchStore } from "@/store/searchStore";
import { useMapStore } from "@/store/mapStore";
import { searchPlaces, reverseGeocode } from "@/features/search/services/geocodingService";
import type { GeocodingResult } from "@/types/map";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useSearch() {
  const store = useSearchStore();
  const { flyTo, setSelectedPlace, mapInstance } = useMapStore();

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core search
  const performSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < MIN_QUERY_LENGTH) {
        store.setResults([]);
        store.setIsSearching(false);
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      store.setIsSearching(true);
      store.setError(null);

      try {
        const results = await searchPlaces(q, { limit: 8 });
        store.setResults(results);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          store.setError((err as Error).message);
          store.setResults([]);
        }
      } finally {
        store.setIsSearching(false);
      }
    },
    [store]
  );

  // Debounced query change
  const handleQueryChange = useCallback(
    (value: string) => {
      store.setQuery(value);
      store.setIsOpen(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        store.setResults([]);
        store.setIsSearching(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, DEBOUNCE_MS);
    },
    [store, performSearch]
  );

  // Select a result
  const handleSelectResult = useCallback(
    (result: GeocodingResult) => {
      store.setSelectedResult(result);
      store.addRecentSearch(result);
      store.setIsOpen(false);
      store.setQuery(result.name);
    },
    [store]
  );

  // Clear
  const handleClear = useCallback(() => {
    store.setQuery("");
    store.setResults([]);
    store.setSelectedResult(null);
    store.setIsOpen(false);
    store.setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, [store]);

  const handleFocus = useCallback(() => {
    store.setIsOpen(true);
  }, [store]);

  const handleBlur = useCallback(() => {
    setTimeout(() => store.setIsOpen(false), 200);
  }, [store]);

  // Reverse geocode on map click (Phase 2 feature)
  useEffect(() => {
    if (!mapInstance) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;

      // Don't interfere if actively searching
      if (store.query.trim()) return;

      try {
        const result = await reverseGeocode({ lng, lat });
        if (result) {
          setSelectedPlace(result);
          store.setQuery(result.name);
        } else {
          // No result — show coordinate pin
          const coordResult: GeocodingResult = {
            id: `click-${lat}-${lng}`,
            name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            displayName: `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`,
            category: "Coordinates",
            address: `${Math.abs(lat).toFixed(6)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(6)}°${lng >= 0 ? "E" : "W"}`,
            coordinates: { lng, lat },
          };
          setSelectedPlace(coordResult);
        }
      } catch {
        // Silently fail on map click reverse geocode
      }
    };

    mapInstance.on("click", handleClick);
    return () => {
      mapInstance.off("click", handleClick);
    };
  }, [mapInstance, store, setSelectedPlace]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return {
    query: store.query,
    results: store.results,
    isSearching: store.isSearching,
    isOpen: store.isOpen,
    selectedResult: store.selectedResult,
    recentSearches: store.recentSearches,
    handleQueryChange,
    handleSelectResult,
    handleClear,
    handleFocus,
    handleBlur,
    // Expose for keyboard nav in SearchBar
    setSelectedPlace,
    flyTo,
  };
}