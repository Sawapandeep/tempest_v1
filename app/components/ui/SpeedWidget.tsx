"use client";
// components/ui/SpeedWidget.tsx

import { cn } from "@/lib/utils";
import GlassPanel from "./GlassPanel";

interface SpeedWidgetProps {
    speed: number; // km/h
    unit?: "kmh" | "mph";
    className?: string;
}

export default function SpeedWidget({ speed, unit = "kmh", className }: SpeedWidgetProps) {
    const maxSpeed = 200;
    const percentage = Math.min((speed / maxSpeed) * 100, 100);
    const displaySpeed = unit === "mph" ? Math.round(speed * 0.621371) : Math.round(speed);

    // Color based on speed
    const speedColor =
        speed > 120
            ? "#FF2D55"
            : speed > 80
                ? "#FFD60A"
                : "#00D4FF";

    // SVG arc calculation
    const r = 38;
    const cx = 50;
    const cy = 50;
    const startAngle = -220;
    const endAngle = 40;
    const totalAngle = endAngle - startAngle;
    const progressAngle = startAngle + (totalAngle * percentage) / 100;

    const polarToCartesian = (angle: number) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        };
    };

    const describeArc = (start: number, end: number) => {
        const s = polarToCartesian(start);
        const e = polarToCartesian(end);
        const largeArc = end - start > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    };

    return (
        <GlassPanel
            className={cn("flex flex-col items-center justify-center p-3 w-28 h-28", className)}
            rounded="2xl"
        >
            <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-0">
                    {/* Background track */}
                    <path
                        d={describeArc(startAngle, endAngle)}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                    {/* Progress arc */}
                    {speed > 0 && (
                        <path
                            d={describeArc(startAngle, progressAngle)}
                            fill="none"
                            stroke={speedColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            style={{
                                filter: `drop-shadow(0 0 4px ${speedColor})`,
                                transition: "all 0.3s ease",
                            }}
                        />
                    )}
                </svg>

                {/* Speed text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="speed-display text-2xl font-bold leading-none"
                        style={{ color: speedColor }}
                    >
                        {displaySpeed}
                    </span>
                    <span className="text-[9px] text-white/40 font-display uppercase tracking-wider mt-0.5">
                        {unit === "kmh" ? "km/h" : "mph"}
                    </span>
                </div>
            </div>
        </GlassPanel>
    );
}