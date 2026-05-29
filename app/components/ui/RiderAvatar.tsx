"use client";
// components/ui/RiderAvatar.tsx

import { cn } from "@/lib/utils";
import { statusColor } from "@/lib/utils";

interface RiderAvatarProps {
    initials: string;
    color: string;
    size?: "xs" | "sm" | "md" | "lg";
    status?: "riding" | "stopped" | "sos" | "offline";
    isLeader?: boolean;
    isMe?: boolean;
    heading?: number;
    className?: string;
    showHeading?: boolean;
}

export default function RiderAvatar({
    initials,
    color,
    size = "md",
    status = "riding",
    isLeader = false,
    isMe = false,
    heading = 0,
    className,
    showHeading = false,
}: RiderAvatarProps) {
    const sizeMap = {
        xs: { outer: "w-7 h-7", text: "text-[9px]", indicator: "w-2 h-2", border: "border" },
        sm: { outer: "w-9 h-9", text: "text-xs", indicator: "w-2.5 h-2.5", border: "border" },
        md: { outer: "w-12 h-12", text: "text-sm", indicator: "w-3 h-3", border: "border-2" },
        lg: { outer: "w-16 h-16", text: "text-base", indicator: "w-3.5 h-3.5", border: "border-2" },
    };

    const s = sizeMap[size];
    const dotColor = statusColor(status);

    return (
        <div className={cn("relative flex-shrink-0", className)}>
            {/* Heading arrow */}
            {showHeading && (
                <div
                    className="absolute inset-0 flex items-start justify-center pointer-events-none z-10"
                    style={{ transform: `rotate(${heading}deg)` }}
                >
                    <div
                        className="w-0 h-0"
                        style={{
                            borderLeft: "4px solid transparent",
                            borderRight: "4px solid transparent",
                            borderBottom: `8px solid ${color}`,
                            marginTop: "-8px",
                            filter: `drop-shadow(0 0 4px ${color})`,
                        }}
                    />
                </div>
            )}

            {/* Avatar circle */}
            <div
                className={cn(
                    s.outer,
                    s.border,
                    "rounded-full flex items-center justify-center font-display font-bold relative overflow-hidden",
                    isMe && "ring-2 ring-offset-1 ring-offset-black",
                    status === "sos" && "animate-sos-pulse"
                )}
                style={{
                    borderColor: color,
                    boxShadow: `0 0 ${size === "lg" ? "20px" : "12px"} ${color}50`,
                    background: `radial-gradient(circle at 30% 30%, ${color}25, ${color}10)`,
                    ringColor: color,
                }}
            >
                <span
                    className={cn(s.text, "font-display font-bold z-10")}
                    style={{ color }}
                >
                    {initials}
                </span>

                {/* Leader crown badge */}
                {isLeader && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-tempest-yellow rounded-full flex items-center justify-center z-20">
                        <span className="text-[8px]">👑</span>
                    </div>
                )}
            </div>

            {/* Status indicator dot */}
            <div
                className={cn(
                    s.indicator,
                    "absolute bottom-0 right-0 rounded-full border-2 border-amoled-black",
                    status === "sos" && "animate-ping"
                )}
                style={{ backgroundColor: dotColor }}
            />
        </div>
    );
}