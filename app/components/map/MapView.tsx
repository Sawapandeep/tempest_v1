"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "@/lib/store";

// ─── Map styles ──────────────────────────────────────────────────────────────

const DARK_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    name: "Tempest Dark",
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
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
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        "esri-world": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "© Esri",
        },
        "esri-labels": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
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
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
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

// ─── Marker helpers ───────────────────────────────────────────────────────────

function createRiderMarkerEl(
    color: string,
    initials: string,
    isMe = false,
    speed = 0,
    status = "riding"
) {
    const el = document.createElement("div");
    el.style.cssText = `width:${isMe ? 52 : 44}px;height:${isMe ? 52 : 44}px;position:relative;cursor:pointer;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));`;
    const speedKmh = Math.round(speed);
    const speedText = speedKmh > 0 ? `${speedKmh}` : "";
    const arrowColor = status === "sos" ? "#FF2D55" : color;
    el.innerHTML = `
    <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 35%,${color}44,${color}22);border:3px solid #FFFFFF;box-shadow:0 0 0 2.5px ${color},0 0 ${isMe ? 28 : 16}px ${color}80,inset 0 1px 0 rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1px;font-family:'Exo 2',sans-serif;font-weight:800;">
      <span style="font-size:${isMe ? 12 : 11}px;color:#FFFFFF;text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px ${color};">${initials}</span>
      ${speedText ? `<span style="font-size:8px;color:${color};font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.8);line-height:1;">${speedText}</span>` : ""}
    </div>
    ${isMe ? `
      <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:12px solid #FFFFFF;filter:drop-shadow(0 -1px 4px rgba(0,0,0,0.6));"></div>
      <div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:10px solid ${arrowColor};"></div>
    ` : ""}
  `;
    if (!document.getElementById("tempest-marker-keyframes")) {
        const s = document.createElement("style");
        s.id = "tempest-marker-keyframes";
        s.textContent = `@keyframes tempest-pulse{0%,100%{box-shadow:0 0 0 2.5px #00D4FF,0 0 20px #00D4FF60;}50%{box-shadow:0 0 0 2.5px #00D4FF,0 0 40px #00D4FFAA;}}`;
        document.head.appendChild(s);
    }
    return el;
}

function createPOIMarkerEl(icon: string, color: string) {
    const el = document.createElement("div");
    el.style.cssText = `width:32px;height:32px;cursor:pointer;position:relative;`;
    el.innerHTML = `
    <div style="width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;transition:transform 0.15s;">
      ${icon}
    </div>
    <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};"></div>
  `;
    el.addEventListener("mouseover", () => { (el.firstElementChild as HTMLElement).style.transform = "scale(1.15)"; });
    el.addEventListener("mouseout", () => { (el.firstElementChild as HTMLElement).style.transform = "scale(1)"; });
    return el;
}

// ─── Route utilities ──────────────────────────────────────────────────────────

interface OSRMRoute {
    geometry: { coordinates: [number, number][] };
    legs: Array<{
        steps: Array<{
            maneuver: { type: string; modifier?: string; location: [number, number] };
            name: string;
            distance: number;
            duration: number;
        }>;
        distance: number;
        duration: number;
    }>;
    distance: number;
    duration: number;
}

async function fetchRoute(
    from: [number, number],
    to: [number, number]
): Promise<OSRMRoute | null> {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === "Ok" && data.routes?.[0]) return data.routes[0];
        return null;
    } catch {
        return null;
    }
}

function maneuverIcon(type: string, modifier?: string): string {
    if (type === "turn") {
        if (modifier === "left" || modifier === "sharp left") return "↰";
        if (modifier === "right" || modifier === "sharp right") return "↱";
        if (modifier === "slight left") return "↖";
        if (modifier === "slight right") return "↗";
        return "↑";
    }
    if (type === "roundabout" || type === "rotary") return "⟳";
    if (type === "arrive") return "📍";
    if (type === "depart") return "🚀";
    return "↑";
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RouteInfo {
    distanceKm: number;
    durationMin: number;
    steps: Array<{ icon: string; text: string; distance: number }>;
    currentStepIdx: number;
}

export default function MapView() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapReadyRef = useRef(false);
    const markersRef = useRef<Record<string, maplibregl.Marker>>({});
    const myMarkerRef = useRef<maplibregl.Marker | null>(null);
    const accuracyMarkerRef = useRef<maplibregl.Marker | null>(null);
    const poiMarkersRef = useRef<maplibregl.Marker[]>([]);
    const watchIdRef = useRef<number | null>(null);
    const currentStyleRef = useRef<string>("dark");
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const routeInfoRef = useRef<RouteInfo | null>(null);

    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [navStep, setNavStep] = useState(0);

    const {
        myLocation, setMyLocation,
        mapSettings, updateMapSettings,
        riderLocations, user,
        navState, setNavState, stopNavigation,
        setSelectedPOI,
    } = useAppStore();

    // ── Marker management ──────────────────────────────────────────
    const removeAllMarkers = useCallback(() => {
        Object.values(markersRef.current).forEach((m) => m.remove());
        markersRef.current = {};
        myMarkerRef.current?.remove();
        myMarkerRef.current = null;
        accuracyMarkerRef.current?.remove();
        accuracyMarkerRef.current = null;
    }, []);

    const removePOIMarkers = useCallback(() => {
        poiMarkersRef.current.forEach((m) => m.remove());
        poiMarkersRef.current = [];
    }, []);

    const reAddAllMarkers = useCallback(() => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current) return;
        const loc = myLocation;
        if (loc) {
            const el = createRiderMarkerEl(user.avatarColor, user.avatarInitials, true, loc.speed);
            myMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([loc.lng, loc.lat]).addTo(map);
            const accEl = document.createElement("div");
            accEl.style.cssText = `width:120px;height:120px;border-radius:50%;background:rgba(0,212,255,0.08);border:1.5px solid rgba(0,212,255,0.25);pointer-events:none;`;
            accuracyMarkerRef.current = new maplibregl.Marker({ element: accEl, anchor: "center" })
                .setLngLat([loc.lng, loc.lat]).addTo(map);
        }
        Object.values(riderLocations).forEach((rider) => {
            const el = createRiderMarkerEl(rider.avatarColor, rider.avatarInitials, false, rider.speed, rider.status);
            const popup = new maplibregl.Popup({ offset: 28, closeButton: false, className: "tempest-popup", maxWidth: "220px" })
                .setHTML(`<div style="font-family:'DM Sans',sans-serif;padding:4px 0;"><div style="font-weight:700;font-size:14px;color:${rider.avatarColor};">${rider.displayName}</div><div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;display:flex;gap:10px;"><span>🏍️ ${Math.round(rider.speed)} km/h</span><span>🔋 ${rider.batteryLevel}%</span></div><div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px;">${rider.status}</div></div>`);
            markersRef.current[rider.userId] = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([rider.lng, rider.lat]).setPopup(popup).addTo(map);
        });
    }, [myLocation, riderLocations, user.avatarColor, user.avatarInitials]);

    // ── Route rendering ────────────────────────────────────────────
    const addRouteToMap = useCallback((map: maplibregl.Map, coords: [number, number][]) => {
        const geojson: GeoJSON.Feature = {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
        };
        if (map.getSource("route")) {
            (map.getSource("route") as maplibregl.GeoJSONSource).setData(geojson);
            return;
        }
        map.addSource("route", { type: "geojson", data: geojson });
        map.addLayer({
            id: "route-casing",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#FFFFFF", "line-width": 12, "line-opacity": 0.25 },
        });
        map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#4285F4", "line-width": 6, "line-opacity": 1 },
        });
        map.addLayer({
            id: "route-progress",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#00D4FF", "line-width": 4, "line-opacity": 0.9 },
        });
    }, []);

    const clearRoute = useCallback((map: maplibregl.Map) => {
        ["route-progress", "route-line", "route-casing"].forEach((id) => {
            if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource("route")) map.removeSource("route");
    }, []);

    // ── POI rendering ──────────────────────────────────────────────
    const POI_CONFIG = [
        { key: "showPetrolPumps", icon: "⛽", color: "#FF9F0A", query: "amenity=fuel" },
        { key: "showMechanics", icon: "🔧", color: "#BF5AF2", query: "shop=motorcycle" },
        { key: "showHospitals", icon: "🏥", color: "#FF2D55", query: "amenity=hospital" },
        { key: "showFoodStops", icon: "🍽️", color: "#00FF88", query: "amenity=restaurant" },
        { key: "showScenicSpots", icon: "📍", color: "#FFD60A", query: "tourism=viewpoint" },
    ];

    const renderPOIs = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current || !myLocation) return;
        removePOIMarkers();

        const center = [myLocation.lng, myLocation.lat];
        const radius = 5000; // 5km

        const activeCategories = POI_CONFIG.filter(
            (c) => mapSettings[c.key as keyof typeof mapSettings] as boolean
        );
        if (activeCategories.length === 0) return;

        // Build Overpass query
        const conditions = activeCategories.map((c) => `node[${c.query}](around:${radius},${center[1]},${center[0]});`).join("");
        const query = `[out:json][timeout:10];(${conditions});out body 30;`;

        try {
            const res = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: `data=${encodeURIComponent(query)}`,
            });
            const data = await res.json();

            data.elements?.forEach((el: { lat: number; lon: number; tags?: Record<string, string> }) => {
                if (!el.lat || !el.lon) return;
                // Find which category this belongs to
                let cat = activeCategories[0];
                for (const c of activeCategories) {
                    const [k, v] = c.query.split("=");
                    if (el.tags?.[k] === v) { cat = c; break; }
                }
                const markerEl = createPOIMarkerEl(cat.icon, cat.color);
                const name = el.tags?.name || el.tags?.operator || cat.query.split("=")[1];
                const popup = new maplibregl.Popup({ offset: 20, closeButton: false, className: "tempest-popup", maxWidth: "200px" })
                    .setHTML(`<div style="font-family:'DM Sans',sans-serif;padding:4px 0;"><div style="font-weight:700;font-size:13px;color:#FFFFFF;">${cat.icon} ${name}</div></div>`);
                const marker = new maplibregl.Marker({ element: markerEl, anchor: "bottom" })
                    .setLngLat([el.lon, el.lat])
                    .setPopup(popup)
                    .addTo(map);
                markerEl.addEventListener("click", () => {
                    setSelectedPOI({ type: cat.query.split("=")[1], lat: el.lat, lng: el.lon, name });
                });
                poiMarkersRef.current.push(marker);
            });
        } catch {
            // Overpass unavailable — silently skip
        }
    }, [myLocation, mapSettings, removePOIMarkers, setSelectedPOI]);

    // ── Map initialization ─────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: getMapStyle(mapSettings.style),
            center: [77.209, 28.6139],
            zoom: 14,
            pitch: 45,
            bearing: 0,
            attributionControl: false,
            maxPitch: 60,
        });

        map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");

        map.on("load", () => {
            mapRef.current = map;
            mapReadyRef.current = true;
            reAddAllMarkers();
        });

        map.on("dragstart", () => updateMapSettings({ followMode: false }));
        map.on("rotate", () => {
            if (mapRef.current) updateMapSettings({ bearing: mapRef.current.getBearing() });
        });
        map.on("zoom", () => {
            if (mapRef.current) updateMapSettings({ zoom: mapRef.current.getZoom() });
        });
        map.on("click", () => {
            popupRef.current?.remove();
            popupRef.current = null;
        });

        return () => {
            removeAllMarkers();
            removePOIMarkers();
            map.remove();
            mapRef.current = null;
            mapReadyRef.current = false;
        };
    }, []);

    // ── Style switching ────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || currentStyleRef.current === mapSettings.style) return;
        currentStyleRef.current = mapSettings.style;
        mapReadyRef.current = false;
        removeAllMarkers();
        map.setStyle(getMapStyle(mapSettings.style));
        const onStyleLoaded = () => {
            mapReadyRef.current = true;
            reAddAllMarkers();
            if (navState.isNavigating && navState.destination && myLocation) {
                fetchRoute(
                    [myLocation.lng, myLocation.lat],
                    [navState.destination.lng, navState.destination.lat]
                ).then((route) => {
                    if (route) addRouteToMap(map, route.geometry.coordinates);
                });
            }
        };
        map.once("styledata", onStyleLoaded);
        return () => { map.off("styledata", onStyleLoaded); };
    }, [mapSettings.style, removeAllMarkers, reAddAllMarkers, addRouteToMap, navState, myLocation]);

    // ── Geolocation ────────────────────────────────────────────────
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
                // Demo location: New Delhi
                setMyLocation({ lat: 28.6139, lng: 77.209, heading: 45, speed: 38, altitude: 216 });
            },
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [setMyLocation]);

    // ── My location marker ─────────────────────────────────────────
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

        if (myMarkerRef.current) {
            myMarkerRef.current.setLngLat([myLocation.lng, myLocation.lat]);
            accuracyMarkerRef.current?.setLngLat([myLocation.lng, myLocation.lat]);
            const newEl = createRiderMarkerEl(user.avatarColor, user.avatarInitials, true, myLocation.speed);
            myMarkerRef.current.remove();
            myMarkerRef.current = new maplibregl.Marker({ element: newEl, anchor: "center" })
                .setLngLat([myLocation.lng, myLocation.lat]).addTo(map);
        } else if (mapReadyRef.current) {
            const el = createRiderMarkerEl(user.avatarColor, user.avatarInitials, true, myLocation.speed);
            myMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat([myLocation.lng, myLocation.lat]).addTo(map);
            const accEl = document.createElement("div");
            accEl.style.cssText = `width:120px;height:120px;border-radius:50%;background:rgba(0,212,255,0.08);border:1.5px solid rgba(0,212,255,0.25);pointer-events:none;`;
            accuracyMarkerRef.current = new maplibregl.Marker({ element: accEl, anchor: "center" })
                .setLngLat([myLocation.lng, myLocation.lat]).addTo(map);
        }
    }, [myLocation, mapSettings.followMode, user.avatarColor, user.avatarInitials]);

    // ── Group rider markers ────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current) return;
        Object.values(riderLocations).forEach((rider) => {
            if (markersRef.current[rider.userId]) {
                markersRef.current[rider.userId].setLngLat([rider.lng, rider.lat]);
            } else {
                const el = createRiderMarkerEl(rider.avatarColor, rider.avatarInitials, false, rider.speed, rider.status);
                const popup = new maplibregl.Popup({ offset: 28, closeButton: false, className: "tempest-popup" })
                    .setHTML(`<div style="font-family:'DM Sans',sans-serif;padding:4px 0;"><div style="font-weight:700;font-size:14px;color:${rider.avatarColor};">${rider.displayName}</div><div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">${Math.round(rider.speed)} km/h · ${rider.batteryLevel}%</div></div>`);
                markersRef.current[rider.userId] = new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat([rider.lng, rider.lat]).setPopup(popup).addTo(map);
            }
        });
        Object.keys(markersRef.current).forEach((uid) => {
            if (!riderLocations[uid]) {
                markersRef.current[uid].remove();
                delete markersRef.current[uid];
            }
        });
    }, [riderLocations]);

    // ── Navigation / routing ───────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current) return;

        if (!navState.isNavigating || !navState.destination || !myLocation) {
            clearRoute(map);
            setRouteInfo(null);
            return;
        }

        fetchRoute(
            [myLocation.lng, myLocation.lat],
            [navState.destination.lng, navState.destination.lat]
        ).then((route) => {
            if (!route || !mapRef.current) return;
            addRouteToMap(mapRef.current, route.geometry.coordinates);

            const steps = route.legs[0]?.steps?.map((step) => ({
                icon: maneuverIcon(step.maneuver.type, step.maneuver.modifier),
                text: step.name || step.maneuver.type,
                distance: step.distance,
            })) ?? [];

            const info: RouteInfo = {
                distanceKm: route.distance / 1000,
                durationMin: route.duration / 60,
                steps,
                currentStepIdx: 0,
            };
            routeInfoRef.current = info;
            setRouteInfo(info);
            setNavStep(0);

            // Update store with route data
            setNavState({
                distanceRemaining: route.distance,
                etaMinutes: route.duration / 60,
                nextManeuver: steps[0]?.text ?? "Continue",
                nextManeuverDistance: steps[0]?.distance ?? 0,
            });

            // Fly to fit the route
            const coords = route.geometry.coordinates;
            const bounds = coords.reduce(
                (b, c) => b.extend(c as [number, number]),
                new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
            );
            mapRef.current.fitBounds(bounds, { padding: { top: 120, bottom: 200, left: 60, right: 60 }, duration: 1200 });
        });
    }, [navState.isNavigating, navState.destination?.lat, navState.destination?.lng]);

    // ── POI updates ────────────────────────────────────────────────
    useEffect(() => {
        renderPOIs();
    }, [
        mapSettings.showPetrolPumps, mapSettings.showMechanics, mapSettings.showHospitals,
        mapSettings.showFoodStops, mapSettings.showScenicSpots, myLocation?.lat,
    ]);

    // ── Zoom control ───────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReadyRef.current) return;
        const currentZoom = map.getZoom();
        if (Math.abs(currentZoom - mapSettings.zoom) > 0.5) {
            map.easeTo({ zoom: mapSettings.zoom, duration: 300 });
        }
    }, [mapSettings.zoom]);

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Top gradient */}
            <div className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-10"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.50) 0%, transparent 100%)" }} />

            {/* In-map nav step banner (Google Maps style) */}
            {navState.isNavigating && routeInfo && routeInfo.steps[navStep] && (
                <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
                    style={{ paddingTop: "env(safe-area-inset-top)" }}>
                    <div className="mx-3 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3"
                        style={{ background: "rgba(66,133,244,0.95)", backdropFilter: "blur(16px)" }}>
                        <span style={{ fontSize: 28 }}>{routeInfo.steps[navStep].icon}</span>
                        <div className="flex-1">
                            <p className="font-display font-bold text-white text-sm leading-tight">
                                {routeInfo.steps[navStep].text || "Continue"}
                            </p>
                            <p className="text-blue-200 text-xs font-display mt-0.5">
                                {routeInfo.steps[navStep].distance < 1000
                                    ? `${Math.round(routeInfo.steps[navStep].distance)}m`
                                    : `${(routeInfo.steps[navStep].distance / 1000).toFixed(1)}km`}
                            </p>
                        </div>
                        {navStep < routeInfo.steps.length - 1 && (
                            <div className="flex flex-col items-center opacity-60">
                                <span style={{ fontSize: 14 }}>{routeInfo.steps[navStep + 1]?.icon}</span>
                                <span className="text-[9px] text-white font-display">then</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}