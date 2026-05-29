"use client";
// app/containers/maps.tsx
// Full-screen navigation map section inspired by Google Maps Android layout

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    Navigation, Layers, MapPin, Zap, RotateCcw,
    ChevronUp, Wind, Thermometer, Eye
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { MAP_STYLES, formatSpeed, bearingToCardinal, cn } from "@/lib/utils";
import GlassPanel from "@/app/components/ui/GlassPanel";
import GloveButton from "@/app/components/ui/GloveButton";
import SpeedWidget from "@/app/components/ui/SpeedWidget";
import CompassWidget from "@/app/components/ui/CompassWidget";
import RiderAvatar from "@/app/components/ui/RiderAvatar";
import SOSButton from "@/app/components/ui/SOSButton";
import POIFilterBar from "@/app/components/map/POIFilterBar";
import NavOverlay from "@/app/components/map/NavOverlay";
import SearchBar from "@/app/components/map/SearchBar";

// Dynamic import of map to avoid SSR issues
const Map = dynamic(() => import("@/app/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-amoled-surface flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-tempest-cyan/30 border-t-tempest-cyan rounded-full animate-spin" />
                <p className="text-white/40 font-display text-sm">Loading map...</p>
            </div>
        </div>
    ),
});

export default function MapsContainer() {
    const {
        myLocation,
        mapSettings,
        updateMapSettings,
        riderLocations,
        activeRide,
        navState,
    } = useAppStore();

    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [weatherData] = useState({ temp: 24, windSpeed: 12, humidity: 65, visibility: 8 });
    const [elevation] = useState(1240); // meters

    const riders = Object.values(riderLocations);

    return (
        <div className="relative w-full flex flex-col" style={{ height: "100vh" }}>

            {/* ── Full-screen map ──────────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <Map />
            </div>

            {/* ── Navigation overlay (turn-by-turn) ───────────────────── */}
            {navState.isNavigating && (
                <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3">
                    <NavOverlay />
                </div>
            )}

            {/* ── Top search + controls bar ────────────────────────────── */}
            {!navState.isNavigating && (
                <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 flex flex-col gap-2">
                    <SearchBar />
                    <POIFilterBar />
                </div>
            )}

            {/* ── Right side controls ──────────────────────────────────── */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
                {/* Compass */}
                <CompassWidget bearing={mapSettings.bearing} className="w-14 h-14" />

                {/* Recenter */}
                <button
                    onClick={() => updateMapSettings({ followMode: true })}
                    className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95",
                        mapSettings.followMode
                            ? "bg-tempest-cyan text-amoled-black shadow-[0_0_20px_rgba(0,212,255,0.4)]"
                            : "glass text-white/60"
                    )}
                >
                    <Navigation className="w-5 h-5" />
                </button>

                {/* Layer picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowLayerMenu((v) => !v)}
                        className="w-14 h-14 glass rounded-2xl flex items-center justify-center active:scale-95"
                    >
                        <Layers className="w-5 h-5 text-white/60" />
                    </button>

                    {showLayerMenu && (
                        <GlassPanel
                            variant="strong"
                            className="absolute right-16 top-0 p-2 w-36 animate-scale-in"
                            rounded="xl"
                        >
                            {(["dark", "satellite", "terrain"] as const).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => {
                                        updateMapSettings({ style });
                                        setShowLayerMenu(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-lg text-sm font-display capitalize transition-colors",
                                        mapSettings.style === style
                                            ? "bg-tempest-cyan/15 text-tempest-cyan"
                                            : "text-white/70 hover:bg-white/8"
                                    )}
                                >
                                    {style === "dark" ? "🌙 Night" : style === "satellite" ? "🛰️ Satellite" : "⛰️ Terrain"}
                                </button>
                            ))}
                        </GlassPanel>
                    )}
                </div>

                {/* SOS */}
                <SOSButton compact className="w-14 h-14" />
            </div>

            {/* ── Speed indicator (bottom left) ───────────────────────── */}
            <div className="absolute bottom-32 left-3 z-20">
                <SpeedWidget speed={myLocation?.speed ?? 0} />
            </div>

            {/* ── Active group riders strip ────────────────────────────── */}
            {activeRide && riders.length > 0 && (
                <div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center px-3">
                    <GlassPanel className="flex items-center gap-3 px-4 py-2 rounded-full">
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
                                {rider.distanceFromMe !== undefined && (
                                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-white/50 whitespace-nowrap font-mono">
                                        {rider.distanceFromMe < 1
                                            ? `${Math.round(rider.distanceFromMe * 1000)}m`
                                            : `${rider.distanceFromMe.toFixed(1)}km`}
                                    </span>
                                )}
                            </div>
                        ))}
                        {riders.length > 5 && (
                            <span className="text-xs text-white/40 font-display">+{riders.length - 5}</span>
                        )}
                    </GlassPanel>
                </div>
            )}

            {/* ── Bottom info bar ──────────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4">
                <GlassPanel variant="strong" rounded="3xl" className="p-4">
                    <div className="flex items-center gap-4">

                        {/* Elevation */}
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] text-white/40 uppercase tracking-wider font-display">ALT</span>
                            <span className="text-white font-display font-bold text-sm">{elevation}m</span>
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        {/* Weather mini */}
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-tempest-orange" />
                            <span className="text-white font-display font-bold text-sm">{weatherData.temp}°C</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-tempest-cyan" />
                            <span className="text-white font-display font-bold text-sm">{weatherData.windSpeed} km/h</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-white/40" />
                            <span className="text-white/60 font-display text-sm">{weatherData.visibility}km</span>
                        </div>

                        <div className="flex-1" />

                        {/* Navigate CTA */}
                        {!navState.isNavigating && (
                            <GloveButton
                                variant="cyan"
                                size="sm"
                                icon={<Navigation className="w-4 h-4" />}
                                onClick={() => { }}
                                glow
                            >
                                Navigate
                            </GloveButton>
                        )}
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
}