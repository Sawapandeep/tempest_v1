// src/hooks/useGeolocation.ts
"use client";

import { useCallback, useRef } from "react";
import { useMapStore } from "@/store/mapStore";
import { MAP_CONFIG } from "@/lib/map-config";
import type { UserLocation } from "@/types/map";

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  onSuccess?: (location: UserLocation) => void;
  onError?: (error: string) => void;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 5000,
    onSuccess,
    onError,
  } = options;

  const watchIdRef = useRef<number | null>(null);
  const { setUserLocation, setIsLocating, setLocationError, flyTo, setIsFollowingUser } =
    useMapStore();

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser";
      setLocationError(msg);
      onError?.(msg);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          coordinates: {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          },
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        };
        setUserLocation(location);
        setIsLocating(false);
        flyTo(location.coordinates, MAP_CONFIG.GEOLOCATION_ZOOM);
        onSuccess?.(location);
      },
      (error) => {
        let message: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            message = "An unknown error occurred.";
        }
        setLocationError(message);
        setIsLocating(false);
        onError?.(message);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, setUserLocation, setIsLocating, setLocationError, flyTo, onSuccess, onError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current !== null) return;

    setIsFollowingUser(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: UserLocation = {
          coordinates: {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          },
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        };
        setUserLocation(location);
      },
      (error) => {
        console.error("Watch position error:", error);
      },
      { enableHighAccuracy, maximumAge: 1000 }
    );
  }, [enableHighAccuracy, setUserLocation, setIsFollowingUser]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsFollowingUser(false);
    }
  }, [setIsFollowingUser]);

  return { locate, startWatching, stopWatching };
}