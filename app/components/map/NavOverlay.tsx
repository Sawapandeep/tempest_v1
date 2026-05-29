"use client";
// components/map/NavOverlay.tsx

import { useAppStore } from "@/lib/store";
import { formatDistance, formatETA } from "@/lib/utils";
import GlassPanel from "@/app/components/ui/GlassPanel";
import GloveButton from "../ui/GloveButton";
import { X, Navigation } from "lucide-react";

export default function NavOverlay() {
    const { navState, stopNavigation } = useAppStore();

    if (!navState.isNavigating) return null;

    return (
        <div className="absolute top-0 left-0 right-0 z-30 p-3 animate-slide-up">
            <GlassPanel variant="strong" rounded="3xl" className="p-4">
                <div className="flex items-start gap-3">
                    {/* Maneuver icon */}
                    <div className="w-14 h-14 rounded-2xl bg-tempest-cyan/15 border border-tempest-cyan/30 flex items-center justify-center flex-shrink-0">
                        <Navigation className="w-7 h-7 text-tempest-cyan" />
                    </div>

                    {/* Instruction */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-display font-semibold text-base leading-tight">
                            {navState.nextManeuver || "Continue straight"}
                        </p>
                        <p className="text-tempest-cyan font-display font-bold text-2xl mt-0.5">
                            {formatDistance(navState.nextManeuverDistance / 1000)}
                        </p>
                    </div>

                    {/* Stop button */}
                    <button
                        onClick={stopNavigation}
                        className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-95"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Bottom summary */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                        <span className="text-white/40 text-xs font-display uppercase tracking-wider">Remaining</span>
                        <span className="text-white font-display font-bold text-sm">
                            {formatDistance(navState.distanceRemaining / 1000)}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-white/40 text-xs font-display uppercase tracking-wider">ETA</span>
                        <span className="text-white font-display font-bold text-sm">
                            {formatETA(navState.etaMinutes)}
                        </span>
                    </div>
                    <div className="flex-1" />
                    {navState.destination && (
                        <span className="text-white/50 text-xs truncate max-w-[100px]">
                            → {navState.destination.name}
                        </span>
                    )}
                </div>
            </GlassPanel>
        </div>
    );
}