"use client";
// features/routing/components/RouteInputPanel.tsx

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, ArrowUpDown, MapPin, Navigation2,
    Car, Footprints, Bike, Loader2, LocateFixed, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouting } from "@/features/routing/hooks/useRouting";
import { useMapStore } from "@/store/mapStore";
import { searchPlaces } from "@/features/search/services/geocodingService";
import { ROUTE_PROFILES } from "@/features/routing/lib/routeConfig";
import type { GeocodingResult } from "@/types/map";
import type { RouteProfile } from "@/types/routing";
import { generateId } from "@/lib/utils";

const PROFILE_ICONS: Record<RouteProfile, React.ElementType> = {
    driving: Car,
    walking: Footprints,
    cycling: Bike,
    motorcycle: Car,
    bus: Car,
};

/* ─── WaypointInput ─────────────────────────────────────────── */

interface WaypointInputProps {
    value: string;
    placeholder: string;
    icon: React.ReactNode;
    onSearch: (q: string) => void;
    onSelect: (r: GeocodingResult) => void;
    onCurrentLocation?: () => void;
    autoFocus?: boolean;
}

function WaypointInput({
    value,
    placeholder,
    icon,
    onSearch,
    onSelect,
    onCurrentLocation,
    autoFocus,
}: WaypointInputProps) {
    const [localQuery, setLocalQuery] = useState(value);
    const [results, setResults] = useState<GeocodingResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = (q: string) => {
        setLocalQuery(q);
        onSearch(q);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults([]); return; }
        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const r = await searchPlaces(q, { limit: 5 });
                setResults(r);
            } catch { setResults([]); }
            setIsSearching(false);
        }, 280);
    };

    const handleSelect = (r: GeocodingResult) => {
        setLocalQuery(r.name);
        setResults([]);
        setIsFocused(false);
        onSelect(r);
    };

    const showDropdown = isFocused && (results.length > 0 || isSearching) && localQuery.length > 0;

    return (
        <div className="relative">
            <div
                className={cn(
                    "flex items-center gap-2 px-3 h-10 rounded-xl transition-all duration-150",
                    "bg-surface-subtle border",
                    isFocused ? "border-tempest-500/60 ring-1 ring-tempest-500/30" : "border-border/50"
                )}
            >
                <span className="shrink-0 text-muted-foreground">{icon}</span>
                <input
                    autoFocus={autoFocus}
                    type="text"
                    value={localQuery}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                />
                {isSearching && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />}
                {onCurrentLocation && (
                    <button
                        onMouseDown={(e) => { e.preventDefault(); onCurrentLocation(); }}
                        className="shrink-0 text-muted-foreground hover:text-tempest-400 transition-colors"
                        aria-label="Use current location"
                    >
                        <LocateFixed className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 glass rounded-xl overflow-hidden shadow-tempest-lg max-h-52 overflow-y-auto scrollbar-thin"
                    >
                        {isSearching ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                            </div>
                        ) : (
                            results.map((r) => (
                                <button
                                    key={r.id}
                                    onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
                                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-subtle transition-colors"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                                        {r.address && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{r.address}</p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── RouteInputPanel ───────────────────────────────────────── */

interface RouteInputPanelProps {
    onClose: () => void;
    initialDestinationName?: string;
}

export function RouteInputPanel({ onClose, initialDestinationName }: RouteInputPanelProps) {
    const {
        origin, destination,
        activeProfile, isRouting, error,
        calculateRoute,
        setOriginFromPlace, setOriginFromCoords,
        setDestinationFromPlace,
        setProfile, swapWaypoints,
    } = useRouting();

    const { userLocation } = useMapStore();

    const [originLabel, setOriginLabel] = useState(origin?.label ?? "");
    const [destLabel, setDestLabel] = useState(destination?.label ?? initialDestinationName ?? "");

    const handleUseCurrentLocation = useCallback(() => {
        if (!userLocation) return;
        setOriginFromCoords(userLocation.coordinates, "My Location");
        setOriginLabel("My Location");
    }, [userLocation, setOriginFromCoords]);

    const handleSwap = () => {
        swapWaypoints();
        const tmp = originLabel;
        setOriginLabel(destLabel);
        setDestLabel(tmp);
    };

    const canRoute = !!origin && !!destination;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                <Navigation2 className="w-4 h-4 text-tempest-400 shrink-0" />
                <span className="text-sm font-semibold text-foreground flex-1">Get Directions</span>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close directions"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Mode selector */}
            <div className="flex gap-1 px-4 pb-3">
                {ROUTE_PROFILES.map((p) => {
                    const Icon = PROFILE_ICONS[p.id];
                    const isActive = activeProfile === p.id;
                    return (
                        <motion.button
                            key={p.id}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setProfile(p.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                                isActive
                                    ? "bg-tempest-500/20 text-tempest-400 border border-tempest-500/40"
                                    : "bg-surface-subtle border border-border/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {p.shortLabel}
                        </motion.button>
                    );
                })}
            </div>

            {/* Waypoint inputs */}
            <div className="px-4 pb-3 flex gap-2">
                {/* Visual connector */}
                <div className="flex flex-col items-center pt-2.5 pb-2.5 gap-0 shrink-0">
                    <Circle className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <div className="flex-1 w-px bg-border/50 my-1 min-h-[20px]" />
                    <MapPin className="w-3 h-3 text-tempest-400 fill-tempest-400/30" />
                </div>

                {/* Inputs */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <WaypointInput
                        value={originLabel}
                        placeholder="Your location"
                        icon={<Circle className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
                        onSearch={setOriginLabel}
                        onSelect={(r) => { setOriginFromPlace(r); setOriginLabel(r.name); }}
                        onCurrentLocation={handleUseCurrentLocation}
                        autoFocus={!origin}
                    />
                    <WaypointInput
                        value={destLabel}
                        placeholder="Choose destination"
                        icon={<MapPin className="w-3 h-3 text-tempest-400" />}
                        onSearch={setDestLabel}
                        onSelect={(r) => { setDestinationFromPlace(r); setDestLabel(r.name); }}
                    />
                </div>

                {/* Swap button */}
                <div className="flex items-center pb-0.5 shrink-0">
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={handleSwap}
                        className="w-7 h-7 rounded-lg bg-surface-subtle border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all"
                        aria-label="Swap origin and destination"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                    </motion.button>
                </div>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-2"
                    >
                        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Calculate button */}
            <div className="px-4 pb-4">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={calculateRoute}
                    disabled={!canRoute || isRouting}
                    className={cn(
                        "w-full h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                        canRoute && !isRouting
                            ? "bg-tempest-500 text-white hover:bg-tempest-600"
                            : "bg-surface-subtle border border-border/50 text-muted-foreground cursor-not-allowed"
                    )}
                >
                    {isRouting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</>
                    ) : (
                        <><Navigation2 className="w-4 h-4" /> {canRoute ? "Get Directions" : "Set Origin & Destination"}</>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}