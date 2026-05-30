"use client";
// components/ui/SpeedWidget.tsx — always-visible speed gauge
import { cn } from "@/lib/utils";

interface SpeedWidgetProps {
    speed: number; // km/h
    unit?: "kmh" | "mph";
    className?: string;
}

export default function SpeedWidget({ speed, unit = "kmh", className }: SpeedWidgetProps) {
    const maxSpeed = 200;
    const pct = Math.min((speed / maxSpeed) * 100, 100);
    const display = unit === "mph" ? Math.round(speed * 0.621371) : Math.round(speed);

    const speedColor =
        speed > 120 ? "#FF2D55" :
            speed > 80 ? "#FFD60A" :
                "#00D4FF";

    // SVG arc maths
    const r = 36, cx = 44, cy = 44;
    const startAngle = -210, endAngle = 30;
    const totalAngle = endAngle - startAngle;
    const progAngle = startAngle + (totalAngle * pct) / 100;

    const polar = (a: number) => {
        const rad = ((a - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const arc = (start: number, end: number) => {
        const s = polar(start), e = polar(end);
        const large = end - start > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
    };

    const panelStyle: React.CSSProperties = {
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1.5px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)",
    };

    return (
        <div
            className={cn("flex flex-col items-center justify-center rounded-2xl p-2 w-24 h-24", className)}
            style={panelStyle}
        >
            <div className="relative w-16 h-16">
                <svg viewBox="0 0 88 88" className="w-full h-full">
                    {/* Track */}
                    <path
                        d={arc(startAngle, endAngle)}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                    {/* Progress */}
                    {speed > 0 && (
                        <path
                            d={arc(startAngle, progAngle)}
                            fill="none"
                            stroke={speedColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            style={{
                                filter: `drop-shadow(0 0 5px ${speedColor})`,
                                transition: "all 0.35s ease",
                            }}
                        />
                    )}
                </svg>

                {/* Centred speed text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="font-display font-black leading-none"
                        style={{
                            fontSize: display >= 100 ? 18 : 22,
                            color: speedColor,
                            textShadow: `0 0 12px ${speedColor}80`,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {display}
                    </span>
                    <span className="text-[8px] font-display uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {unit === "kmh" ? "km/h" : "mph"}
                    </span>
                </div>
            </div>
        </div>
    );
}
