"use client";
// features/routing/components/RouteSummaryCard.tsx

import { motion, AnimatePresence } from "framer-motion";
import {
    Car, Footprints, Bike, Clock, Route,
    ChevronDown, ChevronUp, AlertTriangle,
    Anchor, DollarSign, ArrowLeft, Navigation2,
    RefreshCw, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    formatDistance,
    formatDuration,
    getETA,
    ROUTE_PROFILES,
} from "@/features/routing/lib/routeConfig";
import { useRouting } from "@/features/routing/hooks/useRouting";
import type { RouteProfile } from "@/types/routing";

const PROFILE_ICONS: Record<RouteProfile, React.ElementType> = {
    driving: Car,
    walking: Footprints,
    cycling: Bike,
    motorcycle: Car,
    bus: Car,
};

const PROFILE_COLORS: Record<RouteProfile, string> = {
    driving: "text-blue-400",
    walking: "text-emerald-400",
    cycling: "text-amber-400",
    motorcycle: "text-purple-400",
    bus: "text-pink-400",
};

interface RouteAlternativeTabProps {
    index: number;
    route: { distance: number; duration: number; summary?: { hasToll?: boolean; hasFerry?: boolean } };
    isActive: boolean;
    onClick: () => void;
    profile: RouteProfile;
}

function RouteAlternativeTab({ index, route, isActive, onClick }: RouteAlternativeTabProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all duration-150",
                isActive
                    ? "bg-tempest-500/20 border border-tempest-500/40 text-tempest-400"
                    : "bg-surface-subtle border border-border/50 text-muted-foreground hover:text-foreground"
            )}
        >
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {index === 0 ? "Best" : `Alt ${index}`}
            </span>
            <span className="text-sm font-bold leading-none">{formatDuration(route.duration)}</span>
            <span className="text-[10px] opacity-80">{formatDistance(route.distance)}</span>
            <div className="flex items-center gap-1 mt-0.5">
                {route.summary?.hasToll && <DollarSign className="w-2.5 h-2.5 text-amber-400" />}
                {route.summary?.hasFerry && <Anchor className="w-2.5 h-2.5 text-blue-400" />}
            </div>
        </motion.button>
    );
}

interface RouteSummaryCardProps {
    onBack: () => void;
    onShowDirections: () => void;
    isDirectionsOpen: boolean;
}

export function RouteSummaryCard({ onBack, onShowDirections, isDirectionsOpen }: RouteSummaryCardProps) {
    const {
        routes,
        activeRoute,
        activeRouteIndex,
        activeProfile,
        origin,
        destination,
        isRouting,
        setActiveRouteIndex,
        setProfile,
    } = useRouting();

    if (!activeRoute && !isRouting) return null;

    const ProfileIcon = PROFILE_ICONS[activeProfile];
    const profileColor = PROFILE_COLORS[activeProfile];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Route header: back + breadcrumb */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <button
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground transition-colors -ml-1 shrink-0"
                    aria-label="Back to input"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-1 min-w-0 text-xs">
                    <span className="text-muted-foreground truncate">{origin?.label}</span>
                    <Navigation2 className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    <span className="text-foreground font-medium truncate">{destination?.label}</span>
                </div>
            </div>

            {/* Transport mode selector */}
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
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all",
                                isActive
                                    ? "bg-tempest-500/20 text-tempest-400 border border-tempest-500/40"
                                    : "bg-surface-subtle border border-border/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-3 h-3" />
                            {p.shortLabel}
                        </motion.button>
                    );
                })}
            </div>

            {/* Loading state */}
            {isRouting && (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Calculating route…</span>
                </div>
            )}

            {/* Route result */}
            {!isRouting && activeRoute && (
                <>
                    {/* Main stats */}
                    <div className="flex items-center gap-4 px-4 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-tempest-500/10 border border-tempest-500/20">
                                <ProfileIcon className={cn("w-4 h-4", profileColor)} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-foreground leading-none">
                                    {formatDuration(activeRoute.duration)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDistance(activeRoute.distance)} · ETA {getETA(activeRoute.duration)}
                                </p>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
                            {activeRoute.summary?.hasToll && (
                                <span className="flex items-center gap-1 text-[10px] bg-amber-400/10 text-amber-400 rounded-md px-2 py-1 font-medium">
                                    <DollarSign className="w-2.5 h-2.5" /> Toll
                                </span>
                            )}
                            {activeRoute.summary?.hasFerry && (
                                <span className="flex items-center gap-1 text-[10px] bg-blue-400/10 text-blue-400 rounded-md px-2 py-1 font-medium">
                                    <Anchor className="w-2.5 h-2.5" /> Ferry
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Alternative routes */}
                    {routes.length > 1 && (
                        <div className="flex gap-2 px-4 pb-3">
                            {routes.map((r, i) => (
                                <RouteAlternativeTab
                                    key={r.id}
                                    index={i}
                                    route={r}
                                    isActive={i === activeRouteIndex}
                                    onClick={() => setActiveRouteIndex(i)}
                                    profile={activeProfile}
                                />
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 px-4 pb-4">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={onShowDirections}
                            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-tempest-500 text-white text-sm font-medium hover:bg-tempest-600 transition-colors"
                        >
                            {isDirectionsOpen ? (
                                <><ChevronUp className="w-3.5 h-3.5" /> Hide Steps</>
                            ) : (
                                <><Route className="w-3.5 h-3.5" /> Directions</>
                            )}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            className="w-10 h-10 rounded-xl bg-surface-subtle border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                            aria-label="Route info"
                        >
                            <Info className="w-4 h-4" />
                        </motion.button>
                    </div>
                </>
            )}
        </motion.div>
    );
}