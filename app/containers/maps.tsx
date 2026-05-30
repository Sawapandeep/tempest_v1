"use client";
// app/containers/maps.tsx
// Google Maps Android fidelity — search top, FABs right, speed bottom-left, info card bottom
// All FAB/panel surfaces use rgba with high opacity so they're visible on any tile
import { useState } from "react";
import dynamic from "next/dynamic";
import { Navigation, Layers, Wind, Thermometer, Eye, Plus, Minus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import SpeedWidget from "@/app/components/ui/SpeedWidget";
import CompassWidget from "@/app/components/ui/CompassWidget";
import RiderAvatar from "@/app/components/ui/RiderAvatar";
import SOSButton from "@/app/components/ui/SOSButton";
import POIFilterBar from "@/app/components/map/POIFilterBar";
import NavOverlay from "@/app/components/map/NavOverlay";
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

// ─── Shared FAB / panel surface style — always opaque enough ────────
const fabStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)",
};

const infoBarStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.95)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1.5px solid rgba(255,255,255,0.14)",
    boxShadow: "0 -4px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
};

export default function MapsContainer() {
    const {
        myLocation, mapSettings, updateMapSettings,
        riderLocations, activeRide, navState,
    } = useAppStore();

    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [weatherData] = useState({ temp: 24, windSpeed: 12, visibility: 8 });
    const [elevation] = useState(1240);
    const riders = Object.values(riderLocations);

    const fabBtn = cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all duration-200 select-none"
    );

    return (
        <div className="relative w-full" style={{ height: "100vh" }}>
            {/* ── Fullscreen map ──────────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <MapView />
            </div>

            {/* ── Nav overlay ────────────────────────────────────────── */}
            {navState.isNavigating && (
                <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3">
                    <NavOverlay />
                </div>
            )}

            {/* ── Top bar: search + POI chips ────────────────────────── */}
            {!navState.isNavigating && (
                <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-12 flex flex-col gap-2">
                    <SearchBar />
                    <POIFilterBar />
                </div>
            )}

            {/* ── Right FAB column — Google Maps style ───────────────── */}
            <div
                className="absolute right-3 z-20 flex flex-col gap-2.5"
                style={{ bottom: "8rem" }}
            >
                {/* Compass — tapping resets north */}
                <CompassWidget
                    bearing={mapSettings.bearing}
                    onPress={() => updateMapSettings({ bearing: 0 })}
                />

                {/* Re-center / follow */}
                <button
                    onClick={() => updateMapSettings({ followMode: true })}
                    className={fabBtn}
                    style={
                        mapSettings.followMode
                            ? { background: "#00D4FF", boxShadow: "0 0 20px rgba(0,212,255,0.55)", border: "none" }
                            : fabStyle
                    }
                >
                    <Navigation
                        className="w-5 h-5"
                        style={{ color: mapSettings.followMode ? "#000" : "#FFFFFF" }}
                    />
                </button>

                {/* Zoom in */}
                <button
                    className={fabBtn}
                    style={fabStyle}
                    onClick={() => {
                        // handled by map internally; this is a visual affordance
                        updateMapSettings({ zoom: Math.min((mapSettings.zoom ?? 15) + 1, 20) });
                    }}
                >
                    <Plus className="w-5 h-5 text-white" />
                </button>

                {/* Zoom out */}
                <button
                    className={fabBtn}
                    style={fabStyle}
                    onClick={() => {
                        updateMapSettings({ zoom: Math.max((mapSettings.zoom ?? 15) - 1, 3) });
                    }}
                >
                    <Minus className="w-5 h-5 text-white" />
                </button>

                {/* Layer picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowLayerMenu((v) => !v)}
                        className={fabBtn}
                        style={fabStyle}
                    >
                        <Layers className="w-5 h-5 text-white" />
                    </button>

                    {showLayerMenu && (
                        <div
                            className="absolute right-16 top-0 p-1.5 w-36 rounded-xl overflow-hidden animate-scale-in z-50"
                            style={fabStyle}
                        >
                            {LAYER_OPTIONS.map(({ id, emoji, label }) => {
                                const active = mapSettings.style === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => { updateMapSettings({ style: id }); setShowLayerMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-display transition-all active:scale-95"
                                        style={{
                                            background: active ? "rgba(0,212,255,0.15)" : "transparent",
                                            color: active ? "#00D4FF" : "rgba(255,255,255,0.7)",
                                        }}
                                    >
                                        <span>{emoji}</span>
                                        <span>{label}</span>
                                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-tempest-cyan" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SOS */}
                <SOSButton compact className="w-14 h-14" />
            </div>

            {/* ── Speed gauge — bottom left ───────────────────────────── */}
            <div className="absolute left-3 z-20" style={{ bottom: "8.5rem" }}>
                <SpeedWidget speed={myLocation?.speed ?? 0} />
            </div>

            {/* ── Group riders strip — above info bar ────────────────── */}
            {activeRide && riders.length > 0 && (
                <div
                    className="absolute left-0 right-0 z-20 flex justify-center px-3"
                    style={{ bottom: "7.5rem" }}
                >
                    <div
                        className="flex items-center gap-3 px-5 py-2.5 rounded-full"
                        style={fabStyle}
                    >
                        {riders.slice(0, 5).map((rider) => (
                            <div key={rider.userId} className="relative">
                                <RiderAvatar
                                    initials={rider.avatarInitials}
                                    color={rider.avatarColor}
                                    status={rider.status}
                                    size="sm"
                                    heading={rider.heading}
                                    showHeading
                                />
                                <span
                                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap font-mono text-white/50"
                                >
                                    {rider.distanceFromMe !== undefined
                                        ? rider.distanceFromMe < 1
                                            ? `${Math.round(rider.distanceFromMe * 1000)}m`
                                            : `${rider.distanceFromMe.toFixed(1)}km`
                                        : ""}
                                </span>
                            </div>
                        ))}
                        {riders.length > 5 && (
                            <span className="text-xs font-display text-white/50">+{riders.length - 5}</span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Bottom info bar — Google Maps card style ─────────────── */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4">
                <div className="px-4 py-3.5 rounded-3xl" style={infoBarStyle}>
                    <div className="flex items-center gap-3">
                        {/* Elevation */}
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
                            <span className="font-display font-bold text-sm text-white">{weatherData.windSpeed} km/h</span>
                        </div>

                        {/* Visibility */}
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-white/40 flex-shrink-0" />
                            <span className="font-display text-sm text-white/60">{weatherData.visibility}km</span>
                        </div>

                        <div className="flex-1" />

                        {/* Navigate CTA */}
                        {!navState.isNavigating && (
                            <button
                                className="flex items-center gap-2 px-4 h-9 rounded-xl font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{
                                    background: "rgba(0,212,255,0.15)",
                                    border: "1px solid rgba(0,212,255,0.35)",
                                    color: "#00D4FF",
                                    boxShadow: "0 0 16px rgba(0,212,255,0.20)",
                                }}
                            >
                                <Navigation className="w-4 h-4" />
                                Navigate
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
