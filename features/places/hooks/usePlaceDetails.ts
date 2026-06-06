"use client";
// features/places/hooks/usePlaceDetails.ts

import { useEffect, useCallback } from "react";
import { usePlaceStore } from "@/store/placeStore";
import { useMapStore } from "@/store/mapStore";
import { enrichPlaceDetails } from "@/features/places/services/placeService";
import type { GeocodingResult } from "@/types/map";

export function usePlaceDetails() {
  const { details, loadState, error, setDetails, setLoadState, setError, reset } =
    usePlaceStore();

  const selectedPlace = useMapStore((s) => s.selectedPlace);

  // Load details whenever selectedPlace changes
  useEffect(() => {
    if (!selectedPlace) {
      reset();
      return;
    }

    // Skip if it's a raw coordinate pin (no OSM ID)
    if (selectedPlace.id.startsWith("coord-") || selectedPlace.id.startsWith("click-")) {
      setDetails({
        id: selectedPlace.id,
        name: selectedPlace.name,
        category: selectedPlace.category,
        address: selectedPlace.address,
        coordinates: selectedPlace.coordinates,
      });
      setLoadState("loaded");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadState("loading");
      setError(null);

      try {
        const enriched = await enrichPlaceDetails(selectedPlace);
        if (!cancelled) {
          setDetails(enriched);
          setLoadState("loaded");
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setLoadState("error");
          // Still show basic info from selectedPlace
          setDetails({
            id: selectedPlace.id,
            name: selectedPlace.name,
            category: selectedPlace.category,
            address: selectedPlace.address,
            coordinates: selectedPlace.coordinates,
          });
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedPlace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    useMapStore.getState().setSelectedPlace(null);
    reset();
  }, [reset]);

  return { details, loadState, error, dismiss };
}