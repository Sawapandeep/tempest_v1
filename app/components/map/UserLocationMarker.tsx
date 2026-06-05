"use client";
// src/components/map/UserLocationMarker.tsx

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/mapStore";

export function UserLocationMarker() {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const { mapInstance, userLocation } = useMapStore();

  useEffect(() => {
    if (!mapInstance || !userLocation) return;

    // Create custom element
    const el = document.createElement("div");
    el.className = "tempest-user-location-marker";
    el.innerHTML = `
      <div style="position:relative; width:20px; height:20px;">
        <div style="
          position:absolute; inset:0;
          border-radius:50%;
          background:rgba(42,159,240,0.2);
          animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
          position:absolute; inset:3px;
          border-radius:50%;
          background:#2a9ff0;
          border:2.5px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>
      </div>
    `;

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create new marker
    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([userLocation.coordinates.lng, userLocation.coordinates.lat])
      .addTo(mapInstance);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [mapInstance, userLocation]);

  // Update position smoothly
  useEffect(() => {
    if (!markerRef.current || !userLocation) return;
    markerRef.current.setLngLat([
      userLocation.coordinates.lng,
      userLocation.coordinates.lat,
    ]);
  }, [userLocation]);

  // Add keyframes for ping animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ping {
        75%, 100% { transform: scale(2.2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return null; // Rendered into the map DOM
}