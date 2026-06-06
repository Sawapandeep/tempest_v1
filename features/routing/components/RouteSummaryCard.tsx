"use client";
// features/routing/components/RouteSummaryCard.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
    Car, Footprints, Bike, Clock, Route,
    ChevronDown, ChevronUp, AlertTriangle,
    Anchor, DollarSign, ArrowLeft, Navigation2,
    RefreshCw, Info, Play, StopCircle,
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
import { useRouteStore } from "@/store/routeStore";

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

// ── Navigation banner shown during active navigation ─────────────────────────
function NavigationBanner() {
    const { activeRoute, activeStepIndex, activeProfile } = useRouting();
    const isNavigating = useRouteStore((s) => s.isNavigating);
    const setIsNavigating = useRouteStore((s) => s.setIsNavigating);
    const setStep = useRouteStore((s) => s.setActiveStepIndex);

    if (!isNavigating || !activeRoute) return null;

    const steps = activeRoute.maneuvers;
    const step = steps[activeStepIndex];
    const isLast = activeStepIndex >= steps.length - 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mb-3 rounded-2xl overflow-hidden bg-tempest-500/10 border border-tempest-500/30"
        >
            {/* Current step */}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-tempest-500 flex items-center justify-center shrink-0">
                    <Navigation2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {step?.instruction ?? "Arrive at destination"}
                    </p>
                    {step?.streetName && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{step.streetName}</p>
                    )}
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-tempest-400">{step ? formatDistance(step.distance) : ""}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {activeStepIndex + 1} / {steps.length}
                    </p>
                </div>
            </div>

            {/* Step navigation */}
            <div className="flex gap-2 px-4 pb-3">
                <button
                    disabled={activeStepIndex === 0}
                    onClick={() => setStep(activeStepIndex - 1)}
                    className="flex-1 h-8 rounded-xl bg-surface-subtle border border-border/50 text-xs font-medium text-muted-foreground disabled:opacity-40 hover:bg-surface-elevated transition-all"
                >
                    ← Prev
                </button>
                {isLast ? (
                    <button
                        onClick={() => setIsNavigating(false)}
                        className="flex-1 h-8 rounded-xl bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-1"
                    >
                        <StopCircle className="w-3.5 h-3.5" /> End
                    </button>
                ) : (
                    <button
                        onClick={() => setStep(activeStepIndex + 1)}
                        className="flex-1 h-8 rounded-xl bg-tempest-500/20 border border-tempest-500/30 text-xs font-medium text-tempest-400 hover:bg-tempest-500/30 transition-all"
                    >
                        Next →
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
interface RouteSummaryCardProps {
    onBack: () => void;
    onShowDirections: () => void;
    isDirectionsOpen: boolean;
}

export function RouteSummaryCard({ onBack, onShowDirections, isDirectionsOpen }: RouteSummaryCardProps) {
    const {
        routes, activeRoute, activeRouteIndex,
        activeProfile, origin, destination,
        isRouting, setActiveRouteIndex, setProfile,
    } = useRouting();

    const isNavigating = useRouteStore((s) => s.isNavigating);
    const setIsNavigating = useRouteStore((s) => s.setIsNavigating);
    const setStep = useRouteStore((s) => s.setActiveStepIndex);

    if (!activeRoute && !isRouting) return null;

    const ProfileIcon = PROFILE_ICONS[activeProfile];
    const profileColor = PROFILE_COLORS[activeProfile];

    const startNavigation = () => {
        setStep(0);
        setIsNavigating(true);
    };

    const stopNavigation = () => {
        setIsNavigating(false);
        setStep(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Breadcrumb header */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors -ml-1 shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-1 min-w-0 text-xs">
                    <span className="text-muted-foreground truncate">{origin?.label}</span>
                    <Navigation2 className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    <span className="text-foreground font-medium truncate">{destination?.label}</span>
                </div>
            </div>

            {/* Profile tabs */}
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

            {/* Loading */}
            {isRouting && (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Calculating route…</span>
                </div>
            )}

            {/* Route info */}
            {!isRouting && activeRoute && (
                <>
                    {/* Navigation banner */}
                    <AnimatePresence>
                        {isNavigating && <NavigationBanner />}
                    </AnimatePresence>

                    {/* Summary row */}
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

                    {/* Alternatives */}
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

                    {/* Action buttons */}
                    <div className="flex gap-2 px-4 pb-4">
                        {/* Start / Stop navigation */}
                        {isNavigating ? (
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={stopNavigation}
                                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                            >
                                <StopCircle className="w-4 h-4" /> Stop Navigation
                            </motion.button>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={startNavigation}
                                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                            >
                                <Play className="w-4 h-4 fill-white" /> Start Navigation
                            </motion.button>
                        )}

                        {/* Turn-by-turn toggle */}
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={onShowDirections}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                "bg-surface-subtle border border-border/50 hover:bg-surface-elevated transition-all",
                                isDirectionsOpen ? "text-tempest-400 border-tempest-500/40" : "text-muted-foreground"
                            )}
                            aria-label={isDirectionsOpen ? "Hide directions" : "Show directions"}
                        >
                            <Route className="w-4 h-4" />
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