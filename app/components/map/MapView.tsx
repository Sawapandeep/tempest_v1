"use client";
// components/map/MapView.tsx
// MapLibre-based interactive map with rider markers and POI overlays

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
// @ts-ignore: CSS module types unavailable in this project setup
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "@/lib/store";
import { MAP_STYLES, haversineDistance } from "@/lib/utils";

// Fallback open-source style
const FALLBACK_STYLE = "https://demotiles.maplibre.org/ style.json";

// Dark style from CartoDB
const DARK_STYLE = {
    version: 8 as const,
    name: "Tempest Dark",
    sources: {
        "carto-dark": {
            type: "raster" as const,
            tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap, © CartoDB",
        },
    },
    layers: [
        {
            id: "background",
            type: "raster" as const,
            source: "carto-dark",
        },
    ],
};

// Satellite style
const SATELLITE_STYLE = {
    ...DARK_STYLE,
    name: "Satellite",
    sources: {
        "esri-world": {
            type: "raster" as const,
            tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© Esri",
        },
    },
    layers: [
        {
            id: "background",
            type: "raster" as const,
            source: "esri-world",
        },
    ],
};

// OSM Style (terrain-ish)
const TERRAIN_STYLE = {
    ...DARK_STYLE,
    name: "Terrain",
    sources: {
        "osm-terrain": {
            type: "raster" as const,
            tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [
        {
            id: "background",
            type: "raster" as const,
            source: "osm-terrain",
        },
    ],
};

function getMapStyle(style: string) {
    switch (style) {
        case "satellite": return SATELLITE_STYLE;
        case "terrain": return TERRAIN_STYLE;
        default: return DARK_STYLE;
    }
}

// SVG for rider marker (glowing cyan dot with heading arrow)
function createRiderMarkerEl(color: string, initials: string, isMe = false) {
    const el = document.createElement("div");
    el.className = "rider-marker";
    el.style.cssText = `
    width: 44px;
    height: 44px;
    position: relative;
    cursor: pointer;
  `;
    el.innerHTML = `
    <div style="
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: ${color}20;
      border: 2px solid ${color};
      box-shadow: 0 0 ${isMe ? "20px" : "12px"} ${color}60;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Exo 2', sans-serif;
      font-weight: 700;
      font-size: 11px;
      color: ${color};
      ${isMe ? "animation: pulse 2s ease-in-out infinite;" : ""}
    ">
      ${initials}
    </div>
    ${isMe ? `
    <div style="
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 10px solid ${color};
      filter: drop-shadow(0 0 4px ${color});
    "></div>` : ""}
  `;

    const style = document.createElement("style");
    style.textContent = `@keyframes pulse { 0%,100% { box-shadow: 0 0 20px ${color}60; } 50% { box-shadow: 0 0 40px ${color}90; } }`;
    el.appendChild(style);
    return el;
}

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Record<string, maplibregl.Marker>>({});
    const myMarkerRef = useRef<maplibregl.Marker | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const {
        myLocation,
        setMyLocation,
        mapSettings,
        updateMapSettings,
        riderLocations,
        updateRiderLocation,
        user,
    } = useAppStore();

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: getMapStyle(mapSettings.style) as maplibregl.StyleSpecification,
            center: [77.209, 28.6139], // Default: New Delhi
            zoom: 13,
            pitch: 0,
            bearing: 0,
            attributionControl: false,
        });

        map.on("load", () => {
            mapRef.current = map;
        });

        map.on("dragstart", () => {
            updateMapSettings({ followMode: false });
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update map style when changed
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setStyle(getMapStyle(mapSettings.style) as maplibregl.StyleSpecification);
    }, [mapSettings.style]);

    // Start geolocation watch
    useEffect(() => {
        if (!navigator.geolocation) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    heading: pos.coords.heading ?? 0,
                    speed: (pos.coords.speed ?? 0) * 3.6, // m/s → km/h
                    altitude: pos.coords.altitude ?? 0,
                };
                setMyLocation(loc);
            },
            (err) => {
                console.warn("Geolocation error:", err.message);
                // Demo location: Delhi
                setMyLocation({ lat: 28.6139, lng: 77.209, heading: 45, speed: 0, altitude: 216 });
            },
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [setMyLocation]);

    // Pan to my location when in follow mode
    useEffect(() => {
        if (!mapRef.current || !myLocation || !mapSettings.followMode) return;

        mapRef.current.easeTo({
            center: [myLocation.lng, myLocation.lat],
            zoom: 15,
            bearing: myLocation.heading,
            duration: 1000,
        });

        // Update my marker
        if (myMarkerRef.current) {
            myMarkerRef.current.setLngLat([myLocation.lng, myLocation.lat]);
        } else if (mapRef.current) {
            const el = createRiderMarkerEl(
                user.avatarColor,
                user.avatarInitials,
                true
            );
            myMarkerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([myLocation.lng, myLocation.lat])
                .addTo(mapRef.current);
        }
    }, [myLocation, mapSettings.followMode, user.avatarColor, user.avatarInitials]);

    // Update compass bearing from map
    useEffect(() => {
        if (!mapRef.current) return;
        const onRotate = () => {
            if (mapRef.current) {
                updateMapSettings({ bearing: mapRef.current.getBearing() });
            }
        };
        mapRef.current.on("rotate", onRotate);
        return () => { mapRef.current?.off("rotate", onRotate); };
    }, [updateMapSettings]);

    // Update other rider markers
    useEffect(() => {
        if (!mapRef.current) return;
        const riders = Object.values(riderLocations);

        // Add / update markers
        riders.forEach((rider) => {
            if (markersRef.current[rider.userId]) {
                markersRef.current[rider.userId].setLngLat([rider.lng, rider.lat]);
            } else {
                const el = createRiderMarkerEl(rider.avatarColor, rider.avatarInitials, false);
                const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
                    .setHTML(`
            <div style="font-family: 'DM Sans', sans-serif; color: white;">
              <strong style="color: ${rider.avatarColor}">${rider.displayName}</strong><br>
              <span style="opacity:0.7">${Math.round(rider.speed)} km/h · ${rider.status}</span>
            </div>
          `);
                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([rider.lng, rider.lat])
                    .setPopup(popup)
                    .addTo(mapRef.current!);
                markersRef.current[rider.userId] = marker;
            }
        });

        // Remove stale markers
        Object.keys(markersRef.current).forEach((uid) => {
            if (!riderLocations[uid]) {
                markersRef.current[uid].remove();
                delete markersRef.current[uid];
            }
        });
    }, [riderLocations]);

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map gradient overlays for readability */}
            <div
                className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10"
                style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
                }}
            />
            <div
                className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
                style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
                }}
            />
        </div>
    );
}