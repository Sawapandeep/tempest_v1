"use client";
// components/ui/CompassWidget.tsx
// Always-visible compass — opaque backing, contrast ring, works on any tile / theme
import { cn } from "@/lib/utils";
import { bearingToCardinal } from "@/lib/utils";

interface CompassWidgetProps {
    bearing: number;
    className?: string;
    onPress?: () => void;
}

export default function CompassWidget({ bearing, className, onPress }: CompassWidgetProps) {
    const cardinal = bearingToCardinal(bearing);

    const panelStyle: React.CSSProperties = {
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1.5px solid rgba(255,255,255,0.16)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)",
    };

    return (
        <button
            onClick={onPress}
            className={cn(
                "flex flex-col items-center justify-center rounded-2xl w-14 h-14 active:scale-90 transition-transform select-none",
                className
            )}
            style={panelStyle}
        >
            {/* Compass rose SVG */}
            <div className="relative w-9 h-9 flex items-center justify-center">
                <svg
                    viewBox="0 0 48 48"
                    className="w-full h-full"
                    style={{
                        transform: `rotate(${-bearing}deg)`,
                        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                    }}
                >
                    {/* Outer ring */}
                    <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

                    {/* N arrow — red/cyan with white halo */}
                    <polygon
                        points="24,5 27.5,22 20.5,22"
                        fill="#00D4FF"
                        stroke="#FFFFFF"
                        strokeWidth="0.8"
                        style={{ filter: "drop-shadow(0 0 4px #00D4FF)" }}
                    />

                    {/* S arrow — muted white */}
                    <polygon
                        points="24,43 27.5,26 20.5,26"
                        fill="rgba(255,255,255,0.28)"
                    />

                    {/* E / W tick marks */}
                    {[0, 90, 180, 270].map((angle) => {
                        const rad = ((angle - 90) * Math.PI) / 180;
                        const x1 = 24 + 17 * Math.cos(rad);
                        const y1 = 24 + 17 * Math.sin(rad);
                        const x2 = 24 + 21 * Math.cos(rad);
                        const y2 = 24 + 21 * Math.sin(rad);
                        return (
                            <line
                                key={angle}
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="rgba(255,255,255,0.30)"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Centre dot */}
                    <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" fillOpacity={0.8} />
                </svg>
            </div>

            {/* Cardinal label */}
            <span
                className="text-[9px] font-display font-bold uppercase tracking-widest mt-0.5"
                style={{ color: "#00D4FF", textShadow: "0 0 8px #00D4FF80" }}
            >
                {cardinal}
            </span>
        </button>
    );
}
