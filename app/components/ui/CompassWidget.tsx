"use client";
// components/ui/CompassWidget.tsx

import { cn } from "@/lib/utils";
import GlassPanel from "./GlassPanel";
import { bearingToCardinal } from "@/lib/utils";

interface CompassWidgetProps {
    bearing: number; // 0–360
    className?: string;
}

export default function CompassWidget({ bearing, className }: CompassWidgetProps) {
    const cardinal = bearingToCardinal(bearing);

    return (
        <GlassPanel
            className={cn("flex flex-col items-center justify-center p-3 w-20 h-20", className)}
            rounded="2xl"
        >
            <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Compass rose */}
                <svg
                    viewBox="0 0 48 48"
                    className="w-full h-full absolute"
                    style={{ transform: `rotate(${-bearing}deg)`, transition: "transform 0.3s ease" }}
                >
                    {/* Circle */}
                    <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                    />
                    {/* N arrow */}
                    <polygon
                        points="24,4 27,22 21,22"
                        fill="#00D4FF"
                        style={{ filter: "drop-shadow(0 0 3px #00D4FF)" }}
                    />
                    {/* S arrow */}
                    <polygon
                        points="24,44 27,26 21,26"
                        fill="rgba(255,255,255,0.3)"
                    />
                    {/* Cardinal marks */}
                    {[0, 90, 180, 270].map((angle) => {
                        const rad = ((angle - 90) * Math.PI) / 180;
                        const x1 = 24 + 17 * Math.cos(rad);
                        const y1 = 24 + 17 * Math.sin(rad);
                        const x2 = 24 + 20 * Math.cos(rad);
                        const y2 = 24 + 20 * Math.sin(rad);
                        return (
                            <line
                                key={angle}
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="1.5"
                            />
                        );
                    })}
                    {/* Center dot */}
                    <circle cx="24" cy="24" r="2" fill="rgba(255,255,255,0.6)" />
                </svg>
            </div>

            {/* Cardinal label */}
            <span className="text-[9px] font-display font-bold text-tempest-cyan mt-1 uppercase tracking-wider">
                {cardinal}
            </span>
        </GlassPanel>
    );
}