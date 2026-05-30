"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
    Navigation, Layers, Wind, Thermometer, Eye, Plus, Minus,
    X, ChevronUp, ChevronDown, Clock, Route, AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import SpeedWidget from "@/app/components/ui/SpeedWidget";
import CompassWidget from "@/app/components/ui/CompassWidget";
import RiderAvatar from "@/app/components/ui/RiderAvatar";
import SOSButton from "@/app/components/ui/SOSButton";
import POIFilterBar from "@/app/components/map/POIFilterBar";
import SearchBar from "@/app/components/map/SearchBar";

const MapView = dynamic(() => import("@/app/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#000" }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-tempest-cyan/30 border-t-tempest-cyan rounded-full animate-spin" />
                <p className="font-display text-sm text-white/40">Loading map…</p>
            </div>
        </div>
    ),
});

const LAYER_OPTIONS = [
    { id: "dark", emoji: "🌙", label: "Night" },
    { id: "satellite", emoji: "🛰️", label: "Satellite" },
    { id: "terrain", emoji: "⛰️", label: "Terrain" },
] as const;

const fabStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)",
};

function formatDuration(min: number): string {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function formatDist(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

// ─── Bottom sheet states ──────────────────────────────────────────────────────
type SheetState = "collapsed" | "peek" | "expanded";

export default function MapsContainer() {
    const {
        myLocation, mapSettings, updateMapSettings,
        riderLocations, activeRide, navState, stopNavigation,
        selectedPOI, setSelectedPOI,
    } = useAppStore();

    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [weatherData] = useState({ temp: 24, windSpeed: 12, visibility: 8 });
    const [elevation] = useState(1240);
    const [sheetState, setSheetState] = useState<SheetState>("collapsed");
    const dragStartY = useRef<number | null>(null);
    const dragStartState = useRef<SheetState>("collapsed");

    const riders = Object.values(riderLocations);

    const fabBtn = cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all duration-200 select-none"
    );

    // Sheet heights
    const sheetHeights: Record<SheetState, string> = {
        collapsed: "0px",
        peek: "72px",
        expanded: "50vh",
    };

    // ── Drag handlers ────────────────────────────────────────────
    const onSheetDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        dragStartY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
        dragStartState.current = sheetState;
    };

    const onSheetDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (dragStartY.current === null) return;
        const endY = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
        const delta = endY - dragStartY.current;
        dragStartY.current = null;
        if (delta > 60) {
            // Swiped down
            setSheetState(dragStartState.current === "expanded" ? "peek" : "collapsed");
        } else if (delta < -60) {
            // Swiped up
            setSheetState(dragStartState.current === "collapsed" ? "peek" : "expanded");
        }
    };

    return (
        <div className="relative w-full" style={{ height: "100vh" }}>
            {/* Map */}
            <div className="absolute inset-0 z-0">
                <MapView />
            </div>

            {/* Search + POI filters */}
            <div className="absolute top-0 left-0 right-0 z-20 px-3 flex flex-col gap-2"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 3rem)" }}>
                <SearchBar />
                {!navState.isNavigating && <POIFilterBar />}
            </div>

            {/* Right FABs */}
            <div className="absolute right-3 z-20 flex flex-col gap-2.5" style={{ bottom: navState.isNavigating ? "14rem" : "9rem" }}>
                <CompassWidget bearing={mapSettings.bearing} onPress={() => updateMapSettings({ bearing: 0 })} />

                {/* Follow mode / recenter */}
                <button
                    onClick={() => updateMapSettings({ followMode: !mapSettings.followMode })}
                    className={fabBtn}
                    style={mapSettings.followMode
                        ? { background: "#4285F4", boxShadow: "0 0 20px rgba(66,133,244,0.55)", border: "none" }
                        : fabStyle}
                >
                    <Navigation className="w-5 h-5" style={{ color: mapSettings.followMode ? "#fff" : "#FFFFFF" }} />
                </button>

                {/* Zoom in */}
                <button className={fabBtn} style={fabStyle}
                    onClick={() => updateMapSettings({ zoom: Math.min((mapSettings.zoom ?? 15) + 1, 20) })}>
                    <Plus className="w-5 h-5 text-white" />
                </button>

                {/* Zoom out */}
                <button className={fabBtn} style={fabStyle}
                    onClick={() => updateMapSettings({ zoom: Math.max((mapSettings.zoom ?? 15) - 1, 3) })}>
                    <Minus className="w-5 h-5 text-white" />
                </button>

                {/* Layer picker */}
                <div className="relative">
                    <button onClick={() => setShowLayerMenu((v) => !v)} className={fabBtn} style={fabStyle}>
                        <Layers className="w-5 h-5 text-white" />
                    </button>
                    {showLayerMenu && (
                        <div className="absolute right-16 top-0 p-1.5 w-36 rounded-xl overflow-hidden animate-scale-in z-50" style={fabStyle}>
                            {LAYER_OPTIONS.map(({ id, emoji, label }) => {
                                const active = mapSettings.style === id;
                                return (
                                    <button key={id} onClick={() => { updateMapSettings({ style: id }); setShowLayerMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-display transition-all active:scale-95"
                                        style={{ background: active ? "rgba(66,133,244,0.2)" : "transparent", color: active ? "#4285F4" : "rgba(255,255,255,0.7)" }}>
                                        <span>{emoji}</span>
                                        <span>{label}</span>
                                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4285F4]" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <SOSButton compact className="w-14 h-14" />
            </div>

            {/* Speed widget */}
            <div className="absolute left-3 z-20" style={{ bottom: navState.isNavigating ? "14.5rem" : "9.5rem" }}>
                <SpeedWidget speed={myLocation?.speed ?? 0} />
            </div>

            {/* Group riders strip */}
            {activeRide && riders.length > 0 && (
                <div className="absolute left-0 right-0 z-20 flex justify-center px-3" style={{ bottom: "8rem" }}>
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-full" style={fabStyle}>
                        {riders.slice(0, 5).map((rider) => (
                            <div key={rider.userId} className="relative">
                                <RiderAvatar initials={rider.avatarInitials} color={rider.avatarColor} status={rider.status} size="sm" heading={rider.heading} showHeading />
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap font-mono text-white/50">
                                    {rider.distanceFromMe !== undefined
                                        ? rider.distanceFromMe < 1 ? `${Math.round(rider.distanceFromMe * 1000)}m` : `${rider.distanceFromMe.toFixed(1)}km`
                                        : ""}
                                </span>
                            </div>
                        ))}
                        {riders.length > 5 && <span className="text-xs font-display text-white/50">+{riders.length - 5}</span>}
                    </div>
                </div>
            )}

            {/* ── Navigation bottom sheet (Google Maps style) ────────── */}
            {navState.isNavigating && navState.destination && (
                <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-4 animate-slide-up">
                    <div className="rounded-3xl overflow-hidden" style={{
                        background: "rgba(10,10,10,0.97)",
                        backdropFilter: "blur(40px)",
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 -4px 40px rgba(0,0,0,0.8)",
                    }}>
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                            onMouseDown={onSheetDragStart} onMouseUp={onSheetDragEnd}
                            onTouchStart={onSheetDragStart} onTouchEnd={onSheetDragEnd}
                            onClick={() => setSheetState(s => s === "expanded" ? "peek" : "expanded")}>
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Destination header */}
                        <div className="px-4 pb-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(66,133,244,0.15)", border: "1.5px solid rgba(66,133,244,0.30)" }}>
                                <Navigation className="w-5 h-5 text-[#4285F4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-white text-base leading-tight truncate">
                                    {navState.destination.name}
                                </p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[#4285F4] font-display font-bold text-sm">
                                        {formatDuration(navState.etaMinutes)}
                                    </span>
                                    <span className="text-white/40 text-xs">·</span>
                                    <span className="text-white/50 text-xs">
                                        {formatDist(navState.distanceRemaining / 1000)}
                                    </span>
                                </div>
                            </div>
                            <button onClick={stopNavigation}
                                className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90"
                                style={{ background: "rgba(255,45,85,0.12)", border: "1px solid rgba(255,45,85,0.25)" }}>
                                <X className="w-5 h-5 text-tempest-red" />
                            </button>
                        </div>

                        {/* Route stats bar */}
                        <div className="px-4 pb-3 flex items-center gap-4"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
                            <div className="flex items-center gap-1.5">
                                <Route className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-white/60 text-xs font-display">
                                    {formatDist(navState.distanceRemaining / 1000)} remaining
                                </span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-white/60 text-xs font-display">
                                    ETA {new Date(Date.now() + navState.etaMinutes * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <div className="flex-1" />
                            <button
                                onClick={() => setSheetState(s => s === "expanded" ? "peek" : "expanded")}
                                className="flex items-center gap-1 text-[#4285F4] text-xs font-display active:opacity-70">
                                Steps
                                {sheetState === "expanded"
                                    ? <ChevronDown className="w-3.5 h-3.5" />
                                    : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {/* Next maneuver */}
                        {navState.nextManeuver && (
                            <div className="mx-3 mb-3 px-3 py-2 rounded-xl flex items-center gap-3"
                                style={{ background: "rgba(66,133,244,0.10)", border: "1px solid rgba(66,133,244,0.20)" }}>
                                <span className="text-xl">↑</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-display font-semibold text-sm truncate">{navState.nextManeuver}</p>
                                    {navState.nextManeuverDistance > 0 && (
                                        <p className="text-[#4285F4] text-xs mt-0.5">
                                            in {navState.nextManeuverDistance < 1000
                                                ? `${Math.round(navState.nextManeuverDistance)}m`
                                                : `${(navState.nextManeuverDistance / 1000).toFixed(1)}km`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Expandable steps list */}
                        <div style={{ height: sheetState === "expanded" ? "30vh" : 0, overflow: "hidden", transition: "height 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
                            <div className="overflow-y-auto px-3 pb-4" style={{ height: "30vh" }}>
                                <p className="text-[10px] font-display uppercase tracking-wider text-white/30 mb-2 pt-1">Turn-by-turn</p>
                                {/* Steps would be populated from MapView's routeInfo via store; placeholder for now */}
                                <div className="flex flex-col gap-1">
                                    {[
                                        { icon: "↑", text: "Continue on NH44", dist: "2.1 km" },
                                        { icon: "↰", text: "Turn left onto Ring Road", dist: "800 m" },
                                        { icon: "↱", text: "Turn right onto GT Karnal Road", dist: "4.5 km" },
                                        { icon: "↑", text: "Continue on NH44", dist: "15 km" },
                                        { icon: "📍", text: `Arrive at ${navState.destination?.name}`, dist: "" },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl"
                                            style={{ background: i === 0 ? "rgba(66,133,244,0.12)" : "transparent" }}>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                                                style={{ background: "rgba(255,255,255,0.07)" }}>
                                                {step.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white/80 text-sm font-body truncate">{step.text}</p>
                                            </div>
                                            {step.dist && <span className="text-white/35 text-xs font-mono flex-shrink-0">{step.dist}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Regular bottom info bar (no nav) ──────────────────── */}
            {!navState.isNavigating && (
                <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4">
                    <div className="px-4 py-3.5 rounded-3xl" style={{
                        background: "rgba(10,10,10,0.95)",
                        backdropFilter: "blur(40px)",
                        WebkitBackdropFilter: "blur(40px)",
                        border: "1.5px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 -4px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}>
                        <div className="flex items-center gap-3">
                            {/* Altitude */}
                            <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[9px] font-display uppercase tracking-wider text-white/40">ALT</span>
                                <span className="font-display font-bold text-sm text-white">{elevation}m</span>
                            </div>
                            <div className="w-px h-7 bg-white/10" />
                            {/* Temp */}
                            <div className="flex items-center gap-1.5">
                                <Thermometer className="w-4 h-4 text-tempest-orange flex-shrink-0" />
                                <span className="font-display font-bold text-sm text-white">{weatherData.temp}°C</span>
                            </div>
                            {/* Wind */}
                            <div className="flex items-center gap-1.5">
                                <Wind className="w-4 h-4 text-tempest-cyan flex-shrink-0" />
                                <span className="font-display font-bold text-sm text-white">{weatherData.windSpeed}</span>
                            </div>
                            {/* Visibility */}
                            <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <span className="font-display text-sm text-white/60">{weatherData.visibility}km</span>
                            </div>
                            <div className="flex-1" />
                            {/* Navigate CTA */}
                            <button
                                className="flex items-center gap-2 px-4 h-9 rounded-xl font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{ background: "rgba(66,133,244,0.18)", border: "1px solid rgba(66,133,244,0.35)", color: "#4285F4" }}
                                onClick={() => {
                                    // Open search to start navigation
                                    useAppStore.getState().setIsSearchOpen(true);
                                }}
                            >
                                <Navigation className="w-4 h-4" />
                                Navigate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── POI detail sheet ──────────────────────────────────── */}
            {selectedPOI && (
                <div className="absolute bottom-0 left-0 right-0 z-40 px-3 pb-4 animate-slide-up">
                    <div className="rounded-3xl p-4" style={{
                        background: "rgba(10,10,10,0.97)",
                        backdropFilter: "blur(40px)",
                        border: "1.5px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
                    }}>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                                📍
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-white text-base truncate">{selectedPOI.name}</p>
                                <p className="text-white/40 text-sm mt-0.5 capitalize">{selectedPOI.type}</p>
                            </div>
                            <button onClick={() => setSelectedPOI(null)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.08)" }}>
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => {
                                    useAppStore.getState().startNavigation({ lat: selectedPOI.lat, lng: selectedPOI.lng, name: selectedPOI.name });
                                    setSelectedPOI(null);
                                }}
                                className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{ background: "#4285F4", color: "#fff" }}>
                                <Navigation className="w-4 h-4" />
                                Directions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}