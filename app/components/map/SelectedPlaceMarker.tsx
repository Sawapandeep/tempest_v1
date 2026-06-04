"use client";
// src/components/map/SelectedPlaceMarker.tsx

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/mapStore";

export function SelectedPlaceMarker() {
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const { mapInstance, selectedPlace } = useMapStore();

    useEffect(() => {
        // Remove previous marker
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        if (!mapInstance || !selectedPlace) return;

        // Build custom pin element
        const el = document.createElement("div");
        el.className = "tempest-marker";
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", `Selected place: ${selectedPlace.name}`);
        el.innerHTML = `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        cursor:pointer;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.45));
      ">
        <div style="
          width:36px; height:36px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background: linear-gradient(135deg, #2a9ff0, #0968b0);
          border:3px solid white;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(42,159,240,0.5);
        ">
          <div style="
            transform:rotate(45deg);
            width:10px; height:10px;
            border-radius:50%;
            background:white;
          "></div>
        </div>
        <div style="
          width:2px; height:8px;
          background: linear-gradient(to bottom, #0968b0, transparent);
          margin-top:-1px;
        "></div>
      </div>
    `;

        const marker = new maplibregl.Marker({
            element: el,
            anchor: "bottom",
            offset: [0, 4],
        })
            .setLngLat([selectedPlace.coordinates.lng, selectedPlace.coordinates.lat])
            .addTo(mapInstance);

        markerRef.current = marker;

        return () => {
            marker.remove();
            markerRef.current = null;
        };
    }, [mapInstance, selectedPlace]);

    return null;
}