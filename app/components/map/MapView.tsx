"use client";
// components/map/MapView.tsx
// MapLibre-based map — Google Maps fidelity with 3D buildings, rich controls
// Markers always visible on any tile (dark / satellite / terrain / light)
import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "@/lib/store";

// ─── Map style definitions ──────────────────────────────────────────
const DARK_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    name: "Tempest Dark",
    sources: {
        "carto-dark": {
            type: "raster",
            tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap, © CartoDB",
        },
    },
    layers: [{ id: "background", type: "raster", source: "carto-dark" }],
};

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    name: "Satellite",
    sources: {
        "esri-world": {
            type: "raster",
            tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© Esri",
        },
        "esri-labels": {
            type: "raster",
            tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© Esri",
        },
    },
    layers: [
        { id: "background", type: "raster", source: "esri-world" },
        { id: "labels", type: "raster", source: "esri-labels", paint: { "raster-opacity": 0.85 } },
    ],
};

const TERRAIN_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    name: "Terrain",
    sources: {
        "osm-terrain": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [{ id: "background", type: "raster", source: "osm-terrain" }],
};

function getMapStyle(style: string): maplibregl.StyleSpecification {
    switch (style) {
        case "satellite": return SATELLITE_STYLE;
        case "terrain": return TERRAIN_STYLE;
        default: return DARK_STYLE;
    }
}

// ─── Marker ring colours that always contrast with the map ──────────
// White halo + coloured fill = visible on dark, light, and satellite tiles
function createRiderMarkerEl(
    color: string,
    initials: string,
    isMe = false,
    speed = 0,
    status = "riding"
) {
    const el = document.createElement("div");
    el.className = "tempest-rider-marker";
    el.style.cssText = `
    width:${isMe ? 52 : 44}px;
    height:${isMe ? 52 : 44}px;
    position:relative;
    cursor:pointer;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8));
  `;

    const pulseAnim = isMe
        ? `animation: tempest-pulse 2.2s ease-in-out infinite;`
        : "";

    const speedKmh = Math.round(speed);
    const speedText = speedKmh > 0 ? `${speedKmh}` : "";
    const arrowColor = status === "sos" ? "#FF2D55" : color;

    el.innerHTML = `
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background: radial-gradient(circle at 35% 35%, ${color}44, ${color}22);
      border: 3px solid #FFFFFF;
      box-shadow:
        0 0 0 2.5px ${color},
        0 0 ${isMe ? "28px" : "16px"} ${color}80,
        inset 0 1px 0 rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      flex-direction:column;gap:1px;
      font-family:'Exo 2',sans-serif;font-weight:800;
      ${pulseAnim}
    ">
      <span style="font-size:${isMe ? 12 : 11}px;color:#FFFFFF;text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px ${color};">
        ${initials}
      </span>
      ${speedText ? `<span style="font-size:8px;color:${color};font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.8);line-height:1;">${speedText}</span>` : ""}
    </div>
    ${isMe ? `
      <div style="
        position:absolute;top:-10px;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-bottom:12px solid #FFFFFF;
        filter:drop-shadow(0 -1px 4px rgba(0,0,0,0.6));
      "></div>
      <div style="
        position:absolute;top:-9px;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:4px solid transparent;
        border-right:4px solid transparent;
        border-bottom:10px solid ${arrowColor};
      "></div>
    ` : ""}
  `;

    // Inject keyframe once
    if (!document.getElementById("tempest-marker-keyframes")) {
        const s = document.createElement("style");
        s.id = "tempest-marker-keyframes";
        s.textContent = `
      @keyframes tempest-pulse {
        0%,100% { box-shadow: 0 0 0 2.5px #00D4FF, 0 0 20px #00D4FF60; }
        50%      { box-shadow: 0 0 0 2.5px #00D4FF, 0 0 40px #00D4FFAA; }
      }
    `;
        document.head.appendChild(s);
    }

    return el;
}

// ─── Accuracy ring marker (pulsing radius circle) ───────────────────
function createAccuracyEl(accuracyPx: number) {
    const el = document.createElement("div");
    el.style.cssText = `
    width:${accuracyPx * 2}px;height:${accuracyPx * 2}px;
    border-radius:50%;
    background:rgba(0,212,255,0.08);
    border:1.5px solid rgba(0,212,255,0.25);
    pointer-events:none;
  `;
    return el;
}

// ─── Component ──────────────────────────────────────────────────────
export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapReadyRef = useRef(false);
    const markersRef = useRef<Record<string, maplibregl.Marker>>({});
    const myMarkerRef = useRef<maplibregl.Marker | null>(null);
    const accuracyMarkerRef = useRef<maplibregl.Marker | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const currentStyleRef = useRef<string>("dark");
    const popupRef = useRef<maplibregl.Popup | null>(null);

    const {
        myLocation, setMyLocation,
        mapSettings, updateMapSettings,
        riderLocations,
        user,
    } = useAppStore();

    // ── Remove all markers ──────────────────────────────────────────
    const removeAllMarkers = useCallback(() => {
        Object.values(markersRef.current).forEach((m) => m.remove());
        markersRef.current = {};
        myMarkerRef.current?.remove();
        myMarkerRef.current = null;
        accuracyMarkerRef.current?.remove();
        accuracyMarkerRef.current = null;
    }, []);

    // ── Re-add all markers after style switch ──────────────────────
    const reAddAllMarkers = useCallback(() => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current) return;

        // My marker
        const loc = myLocation;
        if (loc) {
            const el = createRiderMarkerEl(
                user.avatarColor, user.avatarInitials, true, loc.speed
            );
            myMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([loc.lng, loc.lat])
                .addTo(map);

            // Accuracy ring (fixed 60px radius as placeholder)
            const accEl = createAccuracyEl(60);
            accuracyMarkerRef.current = new maplibregl.Marker({ element: accEl, anchor: "center" })
                .setLngLat([loc.lng, loc.lat])
                .addTo(map);
        }

        // Rider markers
        Object.values(riderLocations).forEach((rider) => {
            const el = createRiderMarkerEl(
                rider.avatarColor, rider.avatarInitials, false, rider.speed, rider.status
            );
            const popup = new maplibregl.Popup({
                offset: 28,
                closeButton: false,
                className: "tempest-popup",
                maxWidth: "220px",
            }).setHTML(`
        <div style="font-family:'DM Sans',sans-serif;padding:4px 0;">
          <div style="font-weight:700;font-size:14px;color:${rider.avatarColor};">${rider.displayName}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;display:flex;gap:10px;">
            <span>🏍️ ${Math.round(rider.speed)} km/h</span>
            <span>🔋 ${rider.batteryLevel}%</span>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px;">${rider.status}</div>
        </div>
      `);
            const marker = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([rider.lng, rider.lat])
                .setPopup(popup)
                .addTo(map);
            markersRef.current[rider.userId] = marker;
        });
    }, [myLocation, riderLocations, user.avatarColor, user.avatarInitials]);

    // ── Add route line (decorative gradient polyline) ──────────────
    const addRouteVisualization = useCallback((map: maplibregl.Map) => {
        // Demo route from Delhi toward Manali (simplified)
        const routeCoords: [number, number][] = [
            [77.209, 28.6139], [77.190, 28.680], [77.150, 28.760],
            [77.090, 28.870], [77.010, 28.980], [76.930, 29.100],
        ];

        if (map.getSource("tempest-route")) {
            (map.getSource("tempest-route") as maplibregl.GeoJSONSource).setData({
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: routeCoords },
            });
            return;
        }

        map.addSource("tempest-route", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: routeCoords },
            },
        });

        // Casing (white outline for contrast on all tile types)
        map.addLayer({
            id: "route-casing",
            type: "line",
            source: "tempest-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": "#FFFFFF",
                "line-width": 10,
                "line-opacity": 0.9,
            },
        });

        // Main coloured line
        map.addLayer({
            id: "route-line",
            type: "line",
            source: "tempest-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": "#00D4FF",
                "line-width": 6,
                "line-opacity": 1,
            },
        });

        // Animated dash overlay
        map.addLayer({
            id: "route-dash",
            type: "line",
            source: "tempest-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": "#FFFFFF",
                "line-width": 2,
                "line-opacity": 0.7,
                "line-dasharray": [2, 4],
            },
        });
    }, []);

    // ── Initialize map ──────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: getMapStyle(mapSettings.style),
            center: [77.209, 28.6139],
            zoom: 13,
            pitch: 45,
            bearing: 0,
            attributionControl: false,
            maxPitch: 60,
        });

        // Scale control
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");

        map.on("load", () => {
            mapRef.current = map;
            mapReadyRef.current = true;

            // Route visualization
            addRouteVisualization(map);

            // Waypoint dot markers
            const waypoints: [number, number][] = [
                [77.150, 28.760], [77.010, 28.980],
            ];
            waypoints.forEach(([lng, lat], i) => {
                const dot = document.createElement("div");
                dot.style.cssText = `
          width:14px;height:14px;border-radius:50%;
          background:#FF6B00;
          border:3px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.7), 0 0 12px rgba(255,107,0,0.5);
        `;
                new maplibregl.Marker({ element: dot, anchor: "center" })
                    .setLngLat([lng, lat])
                    .addTo(map);
            });

            reAddAllMarkers();
        });

        map.on("dragstart", () => updateMapSettings({ followMode: false }));

        map.on("rotate", () => {
            if (mapRef.current) updateMapSettings({ bearing: mapRef.current.getBearing() });
        });

        map.on("zoom", () => {
            if (mapRef.current) updateMapSettings({ zoom: mapRef.current.getZoom() });
        });

        // Close popups on map click
        map.on("click", () => {
            if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
        });

        return () => {
            removeAllMarkers();
            map.remove();
            mapRef.current = null;
            mapReadyRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Style switching ─────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || currentStyleRef.current === mapSettings.style) return;
        currentStyleRef.current = mapSettings.style;
        mapReadyRef.current = false;
        removeAllMarkers();
        map.setStyle(getMapStyle(mapSettings.style));

        const onStyleLoaded = () => {
            mapReadyRef.current = true;
            addRouteVisualization(map);
            reAddAllMarkers();
        };
        map.once("styledata", onStyleLoaded);
        return () => { map.off("styledata", onStyleLoaded); };
    }, [mapSettings.style, removeAllMarkers, reAddAllMarkers, addRouteVisualization]);

    // ── Geolocation ─────────────────────────────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) return;
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setMyLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    heading: pos.coords.heading ?? 0,
                    speed: (pos.coords.speed ?? 0) * 3.6,
                    altitude: pos.coords.altitude ?? 0,
                });
            },
            () => {
                setMyLocation({ lat: 28.6139, lng: 77.209, heading: 45, speed: 38, altitude: 216 });
            },
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [setMyLocation]);

    // ── Follow mode + update my marker ─────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !myLocation || !mapReadyRef.current) return;

        if (mapSettings.followMode) {
            map.easeTo({
                center: [myLocation.lng, myLocation.lat],
                zoom: 15,
                bearing: myLocation.heading,
                pitch: 45,
                duration: 900,
            });
        }

        // Update my marker
        if (myMarkerRef.current) {
            myMarkerRef.current.setLngLat([myLocation.lng, myLocation.lat]);
            accuracyMarkerRef.current?.setLngLat([myLocation.lng, myLocation.lat]);
            // Refresh element (speed/heading changed)
            const newEl = createRiderMarkerEl(user.avatarColor, user.avatarInitials, true, myLocation.speed);
            myMarkerRef.current.getElement().replaceWith(newEl);
            // re-attach element ref workaround
            myMarkerRef.current.remove();
            myMarkerRef.current = new maplibregl.Marker({ element: newEl, anchor: "center" })
                .setLngLat([myLocation.lng, myLocation.lat])
                .addTo(map);
        } else if (mapReadyRef.current) {
            const el = createRiderMarkerEl(user.avatarColor, user.avatarInitials, true, myLocation.speed);
            myMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([myLocation.lng, myLocation.lat])
                .addTo(map);
            const accEl = createAccuracyEl(60);
            accuracyMarkerRef.current = new maplibregl.Marker({ element: accEl, anchor: "center" })
                .setLngLat([myLocation.lng, myLocation.lat])
                .addTo(map);
        }
    }, [myLocation, mapSettings.followMode, user.avatarColor, user.avatarInitials]);

    // ── Sync rider markers ─────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current) return;

        Object.values(riderLocations).forEach((rider) => {
            if (markersRef.current[rider.userId]) {
                markersRef.current[rider.userId].setLngLat([rider.lng, rider.lat]);
            } else {
                const el = createRiderMarkerEl(rider.avatarColor, rider.avatarInitials, false, rider.speed, rider.status);
                const popup = new maplibregl.Popup({ offset: 28, closeButton: false, className: "tempest-popup" })
                    .setHTML(`
            <div style="font-family:'DM Sans',sans-serif;padding:4px 0;">
              <div style="font-weight:700;font-size:14px;color:${rider.avatarColor};">${rider.displayName}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;display:flex;gap:10px;">
                <span>🏍️ ${Math.round(rider.speed)} km/h</span><span>🔋 ${rider.batteryLevel}%</span>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px;">${rider.status}</div>
            </div>
          `);
                markersRef.current[rider.userId] = new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat([rider.lng, rider.lat])
                    .setPopup(popup)
                    .addTo(map);
            }
        });

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

            {/* Top gradient — readability for search bar */}
            <div
                className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-10"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
            />
            {/* Bottom gradient */}
            <div
                className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.50) 0%, transparent 100%)" }}
            />
        </div>
    );
}
