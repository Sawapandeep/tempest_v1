"use client";
// src/features/search/hooks/useSearch.ts

import { useCallback, useEffect, useRef } from "react";
import { useSearchStore } from "@/store/searchStore";
import { searchPlaces } from "@/features/search/services/geocodingService";
import type { GeocodingResult } from "@/types/map";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useSearch() {
  const {
    query, setQuery, setResults, setIsSearching,
    setIsOpen, setError, setSelectedResult,
    addRecentSearch, results, isSearching, isOpen,
    selectedResult, recentSearches,
  } = useSearchStore();

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchPlaces(q, { limit: 8 });
      setResults(results);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [setResults, setIsSearching, setError]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setIsOpen(true);

    // Clear existing debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce the actual search
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, DEBOUNCE_MS);
  }, [setQuery, setIsOpen, setResults, setIsSearching, performSearch]);

  const handleSelectResult = useCallback((result: GeocodingResult) => {
    setSelectedResult(result);
    addRecentSearch(result);
    setIsOpen(false);
    setQuery(result.name);
  }, [setSelectedResult, addRecentSearch, setIsOpen, setQuery]);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setSelectedResult(null);
    setIsOpen(false);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, [setQuery, setResults, setSelectedResult, setIsOpen, setError]);

  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const handleBlur = useCallback(() => {
    // Delay close so clicks on results can register
    setTimeout(() => setIsOpen(false), 200);
  }, [setIsOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    query,
    results,
    isSearching,
    isOpen,
    selectedResult,
    recentSearches,
    handleQueryChange,
    handleSelectResult,
    handleClear,
    handleFocus,
    handleBlur,
  };
}