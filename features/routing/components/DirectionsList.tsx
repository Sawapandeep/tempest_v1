"use client";
// features/routing/components/DirectionsList.tsx

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUp,
    CornerUpRight,
    CornerUpLeft,
    RotateCw,
    RotateCcw,
    MapPin,
    Navigation,
    Anchor,
    AlertTriangle,
    RefreshCw,
    GitFork,
    GitMerge,
    Bell,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getManeuverIcon,
    getManeuverColor,
    formatDistance,
    formatDuration,
} from "@/features/routing/lib/routeConfig";
import { useRouting } from "@/features/routing/hooks/useRouting";
import { useMapStore } from "@/store/mapStore";
import type { RouteManeuver } from "@/types/routing";

const ICON_MAP: Record<string, React.ElementType> = {
    ArrowUp,
    CornerUpRight,
    CornerUpLeft,
    RotateCw,
    RotateCcw,
    MapPin,
    Navigation,
    Anchor,
    AlertTriangle,
    RefreshCw,
    GitFork,
    GitMerge,
    Bell,
};

function ManeuverIcon({
    type,
    modifier,
    className,
}: {
    type: string;
    modifier?: string;
    className?: string;
}) {
    const iconName = getManeuverIcon(type, modifier);
    const Icon = ICON_MAP[iconName] ?? ArrowUp;
    return <Icon className={className} />;
}

interface StepItemProps {
    step: RouteManeuver;
    index: number;
    isActive: boolean;
    isLast: boolean;
    onClick: () => void;
}

function StepItem({ step, index, isActive, isLast, onClick }: StepItemProps) {
    const color = getManeuverColor(step.type);
    return (
        <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
            onClick={onClick}
            className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                isActive
                    ? "bg-tempest-500/10 border border-tempest-500/20"
                    : "hover:bg-surface-subtle"
            )}
            aria-current={isActive ? "step" : undefined}
        >
            {/* Icon + connector line */}
            <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div
                    className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center border",
                        isActive
                            ? "bg-tempest-500/20 border-tempest-500/40"
                            : "bg-surface-subtle border-border/50"
                    )}
                >
                    <ManeuverIcon
                        type={step.type}
                        modifier={step.modifier}
                        className={cn("w-3.5 h-3.5", isActive ? "text-tempest-400" : color)}
                    />
                </div>
                {!isLast && (
                    <div className="w-px flex-1 min-h-[12px] bg-border/30 mt-1" />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pb-1">
                <p className={cn("text-sm leading-snug", isActive ? "text-foreground font-medium" : "text-foreground/90")}>
                    {step.instruction}
                </p>
                {step.streetName && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.streetName}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    {step.distance > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-surface-subtle rounded px-1.5 py-0.5">
                            {formatDistance(step.distance)}
                        </span>
                    )}
                    {step.duration > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                            ~{formatDuration(step.duration)}
                        </span>
                    )}
                </div>
            </div>
        </motion.button>
    );
}

interface DirectionsListProps {
    isExpanded: boolean;
    onToggle: () => void;
    maxHeight?: string;
}

export function DirectionsList({ isExpanded, onToggle, maxHeight = "50vh" }: DirectionsListProps) {
    const { activeRoute, activeStepIndex, setActiveStepIndex } = useRouting();
    const flyTo = useMapStore((s) => s.flyTo);
    const scrollRef = useRef<HTMLDivElement>(null);

    const steps = activeRoute?.maneuvers ?? [];

    // Auto-scroll active step into view
    useEffect(() => {
        if (!isExpanded || !scrollRef.current) return;
        const el = scrollRef.current.querySelector("[aria-current='step']") as HTMLElement | null;
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [activeStepIndex, isExpanded]);

    if (!activeRoute || !steps.length) return null;

    const handleStepClick = (step: RouteManeuver, index: number) => {
        setActiveStepIndex(index);
        flyTo({ lng: step.location.lng, lat: step.location.lat }, 17);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Collapse header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-subtle/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-tempest-400" />
                    <span className="text-sm font-semibold text-foreground">Turn-by-Turn</span>
                    <span className="text-xs text-muted-foreground bg-surface-subtle rounded-full px-2 py-0.5">
                        {steps.length} steps
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* Steps list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <div
                            ref={scrollRef}
                            className="overflow-y-auto scrollbar-thin px-1 py-1"
                            style={{ maxHeight }}
                        >
                            {steps.map((step, i) => (
                                <StepItem
                                    key={`step-${i}`}
                                    step={step}
                                    index={i}
                                    isActive={i === activeStepIndex}
                                    isLast={i === steps.length - 1}
                                    onClick={() => handleStepClick(step, i)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}