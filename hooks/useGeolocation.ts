// hooks/useGeolocation.ts
"use client";
import { useCallback, useRef, useEffect } from "react";
import { useMapStore } from "@/store/mapStore";
import { MAP_CONFIG, INDIA_BOUNDS, isWithinIndia } from "@/lib/map-config";
import type { UserLocation } from "@/types/map";

// If geolocation fails or is outside India, fall back to center of India
const INDIA_CENTER = { lng: 78.9629, lat: 22.5937 };
const INDIA_DEFAULT_ZOOM = 5;

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
    timeout = 15000,
    maximumAge = 0,
    onSuccess,
    onError,
  } = options;

  const watchIdRef = useRef<number | null>(null);

  const {
    setUserLocation,
    setIsLocating,
    setLocationError,
    flyTo,
    setIsFollowingUser,
    mapInstance,
    isMapLoaded,
  } = useMapStore();

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      const { longitude: lng, latitude: lat, accuracy, heading, speed } = position.coords;

      // If user is outside India, ignore their GPS and center on India instead
      if (!isWithinIndia(lng, lat)) {
        setIsLocating(false);
        setLocationError("Your location appears to be outside India. Tempest Maps covers India only.");
        flyTo(INDIA_CENTER, INDIA_DEFAULT_ZOOM);
        onError?.("Location outside India");
        return;
      }

      const location: UserLocation = {
        coordinates: { lng, lat },
        accuracy,
        heading: heading ?? undefined,
        speed:   speed   ?? undefined,
        timestamp: position.timestamp,
      };

      setUserLocation(location);
      setIsLocating(false);
      setLocationError(null);

      const doFly = () => flyTo(location.coordinates, MAP_CONFIG.GEOLOCATION_ZOOM);
      if (mapInstance && isMapLoaded) {
        doFly();
      } else {
        setTimeout(doFly, 600);
      }

      onSuccess?.(location);
    },
    [setUserLocation, setIsLocating, setLocationError, flyTo, mapInstance, isMapLoaded, onSuccess, onError]
  );

  const handleError = useCallback(
    (error: GeolocationPositionError) => {
      let message: string;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location access denied. Please enable location permissions.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location unavailable. Ensure GPS is enabled.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out. Please try again.";
          break;
        default:
          message = `Location error: ${error.message}`;
      }
      setLocationError(message);
      setIsLocating(false);
      setIsFollowingUser(false);
      onError?.(message);
    },
    [setLocationError, setIsLocating, setIsFollowingUser, onError]
  );

  const locate = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser.";
      setLocationError(msg);
      onError?.(msg);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (err) => {
        if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            handlePosition,
            handleError,
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
          );
        } else {
          handleError(err);
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handlePosition, handleError, setIsLocating, setLocationError, onError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;
    setIsFollowingUser(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude: lng, latitude: lat, accuracy, heading, speed } = position.coords;
        if (!isWithinIndia(lng, lat)) return; // silently ignore out-of-India GPS pings
        const location: UserLocation = {
          coordinates: { lng, lat },
          accuracy,
          heading: heading ?? undefined,
          speed:   speed   ?? undefined,
          timestamp: position.timestamp,
        };
        setUserLocation(location);
      },
      (err) => console.warn("Watch position error:", err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    );
  }, [setUserLocation, setIsFollowingUser]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsFollowingUser(false);
    }
  }, [setIsFollowingUser]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { locate, startWatching, stopWatching };
}
//! before landlock
// "use client";
// // hooks/useGeolocation.ts

// import { useCallback, useRef, useEffect } from "react";
// import { useMapStore } from "@/store/mapStore";
// import { MAP_CONFIG } from "@/lib/map-config";
// import type { UserLocation } from "@/types/map";

// interface GeolocationOptions {
//   enableHighAccuracy?: boolean;
//   timeout?: number;
//   maximumAge?: number;
//   onSuccess?: (location: UserLocation) => void;
//   onError?: (error: string) => void;
// }

// export function useGeolocation(options: GeolocationOptions = {}) {
//   const {
//     enableHighAccuracy = true,
//     timeout = 15000,
//     maximumAge = 0,
//     onSuccess,
//     onError,
//   } = options;

//   const watchIdRef = useRef<number | null>(null);
//   const {
//     setUserLocation,
//     setIsLocating,
//     setLocationError,
//     flyTo,
//     setIsFollowingUser,
//     mapInstance,
//     isMapLoaded,
//   } = useMapStore();

//   const handlePosition = useCallback(
//     (position: GeolocationPosition) => {
//       const location: UserLocation = {
//         coordinates: {
//           lng: position.coords.longitude,
//           lat: position.coords.latitude,
//         },
//         accuracy: position.coords.accuracy,
//         heading: position.coords.heading ?? undefined,
//         speed: position.coords.speed ?? undefined,
//         timestamp: position.timestamp,
//       };
//       setUserLocation(location);
//       setIsLocating(false);
//       setLocationError(null);

//       // Wait for map to be ready before flying
//       const doFly = () => {
//         flyTo(location.coordinates, MAP_CONFIG.GEOLOCATION_ZOOM);
//       };

//       if (mapInstance && isMapLoaded) {
//         doFly();
//       } else {
//         // Retry after short delay for mobile where map may still be loading
//         setTimeout(doFly, 600);
//       }

//       onSuccess?.(location);
//     },
//     [setUserLocation, setIsLocating, setLocationError, flyTo, mapInstance, isMapLoaded, onSuccess]
//   );

//   const handleError = useCallback(
//     (error: GeolocationPositionError) => {
//       let message: string;
//       switch (error.code) {
//         case error.PERMISSION_DENIED:
//           message =
//             "Location access denied. Please enable location permissions in your browser settings.";
//           break;
//         case error.POSITION_UNAVAILABLE:
//           message =
//             "Location unavailable. Ensure GPS is enabled on your device.";
//           break;
//         case error.TIMEOUT:
//           message = "Location request timed out. Please try again.";
//           break;
//         default:
//           message = `Location error: ${error.message}`;
//       }
//       setLocationError(message);
//       setIsLocating(false);
//       setIsFollowingUser(false);
//       onError?.(message);
//     },
//     [setLocationError, setIsLocating, setIsFollowingUser, onError]
//   );

//   const locate = useCallback(() => {
//     if (typeof window === "undefined") return;

//     if (!navigator.geolocation) {
//       const msg =
//         "Geolocation is not supported by your browser or device.";
//       setLocationError(msg);
//       onError?.(msg);
//       return;
//     }

//     // On iOS 16+ in non-secure context geolocation is blocked — warn clearly
//     if (
//       typeof window !== "undefined" &&
//       window.location.protocol !== "https:" &&
//       window.location.hostname !== "localhost" &&
//       window.location.hostname !== "127.0.0.1"
//     ) {
//       const msg = "Location requires a secure connection (HTTPS).";
//       setLocationError(msg);
//       onError?.(msg);
//       return;
//     }

//     setIsLocating(true);
//     setLocationError(null);

//     // First try with high accuracy, fall back to low accuracy on failure
//     navigator.geolocation.getCurrentPosition(
//       handlePosition,
//       (err) => {
//         if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
//           // Retry with lower accuracy for better mobile compat
//           navigator.geolocation.getCurrentPosition(
//             handlePosition,
//             handleError,
//             {
//               enableHighAccuracy: false,
//               timeout: 10000,
//               maximumAge: 30000,
//             }
//           );
//         } else {
//           handleError(err);
//         }
//       },
//       { enableHighAccuracy, timeout, maximumAge }
//     );
//   }, [
//     enableHighAccuracy,
//     timeout,
//     maximumAge,
//     handlePosition,
//     handleError,
//     setIsLocating,
//     setLocationError,
//     onError,
//   ]);

//   const startWatching = useCallback(() => {
//     if (!navigator.geolocation) return;
//     if (watchIdRef.current !== null) return;

//     setIsFollowingUser(true);

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (position) => {
//         const location: UserLocation = {
//           coordinates: {
//             lng: position.coords.longitude,
//             lat: position.coords.latitude,
//           },
//           accuracy: position.coords.accuracy,
//           heading: position.coords.heading ?? undefined,
//           speed: position.coords.speed ?? undefined,
//           timestamp: position.timestamp,
//         };
//         setUserLocation(location);
//       },
//       (err) => {
//         console.warn("Watch position error:", err.message);
//       },
//       { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
//     );
//   }, [setUserLocation, setIsFollowingUser]);

//   const stopWatching = useCallback(() => {
//     if (watchIdRef.current !== null) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//       watchIdRef.current = null;
//       setIsFollowingUser(false);
//     }
//   }, [setIsFollowingUser]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }
//     };
//   }, []);

//   return { locate, startWatching, stopWatching };
// }