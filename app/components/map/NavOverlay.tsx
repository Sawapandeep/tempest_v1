"use client";
// components/map/NavOverlay.tsx
import { useAppStore } from "@/lib/store";
import { formatDistance, formatETA } from "@/lib/utils";
import { X, Navigation, ChevronRight } from "lucide-react";

// Always-dark surface so it's readable on any map tile
const overlayStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.96)",
    backdropFilter: "blur(32px)",
    WebkitBackdropFilter: "blur(32px)",
    border: "1.5px solid rgba(255,255,255,0.14)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.80), inset 0 1px 0 rgba(255,255,255,0.06)",
};

export default function NavOverlay() {
    const { navState, stopNavigation } = useAppStore();
    if (!navState.isNavigating) return null;

    return (
        <div className="w-full animate-slide-up">
            <div className="rounded-3xl p-4" style={overlayStyle}>
                <div className="flex items-start gap-3">
                    {/* Maneuver icon */}
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: "rgba(0,212,255,0.15)",
                            border: "1.5px solid rgba(0,212,255,0.35)",
                        }}
                    >
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

                    {/* Stop */}
                    <button
                        onClick={stopNavigation}
                        className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Summary row */}
                <div
                    className="flex items-center gap-4 mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-white/40 text-xs font-display uppercase tracking-wider">Left</span>
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
                        <span className="text-white/45 text-xs truncate max-w-[110px]">
                            → {navState.destination.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
