"use client";
// components/ui/SOSButton.tsx

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface SOSButtonProps {
    className?: string;
    compact?: boolean;
}

export default function SOSButton({ className, compact = false }: SOSButtonProps) {
    const { sosActive, triggerSOS, cancelSOS } = useAppStore();
    const [confirming, setConfirming] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Auto-confirm SOS after 3 seconds
    useEffect(() => {
        if (!confirming) return;
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(interval);
                    triggerSOS();
                    setConfirming(false);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [confirming, triggerSOS]);

    const handlePress = () => {
        if (sosActive) {
            cancelSOS();
            return;
        }
        if (confirming) {
            triggerSOS();
            setConfirming(false);
        } else {
            setConfirming(true);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirming(false);
        setCountdown(0);
    };

    if (compact) {
        return (
            <button
                onClick={handlePress}
                className={cn(
                    "min-w-[56px] min-h-[56px] rounded-2xl flex items-center justify-center font-display font-bold text-sm",
                    "transition-all duration-200 active:scale-95",
                    sosActive
                        ? "bg-tempest-red text-white animate-sos-pulse"
                        : confirming
                            ? "bg-tempest-red/80 text-white"
                            : "bg-tempest-red/15 text-tempest-red border border-tempest-red/30",
                    className
                )}
                style={{
                    boxShadow: sosActive
                        ? "0 0 30px rgba(255,45,85,0.6)"
                        : confirming
                            ? "0 0 20px rgba(255,45,85,0.4)"
                            : undefined,
                }}
            >
                {confirming ? countdown : "SOS"}
            </button>
        );
    }

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <button
                onClick={handlePress}
                className={cn(
                    "min-w-[72px] min-h-[72px] rounded-3xl flex flex-col items-center justify-center gap-1",
                    "font-display font-black text-lg",
                    "transition-all duration-200 active:scale-95 select-none",
                    sosActive
                        ? "bg-tempest-red text-white animate-sos-pulse"
                        : confirming
                            ? "bg-tempest-red text-white"
                            : "bg-tempest-red/15 text-tempest-red border-2 border-tempest-red/40"
                )}
                style={{
                    boxShadow: (sosActive || confirming)
                        ? "0 0 40px rgba(255,45,85,0.7)"
                        : "0 0 16px rgba(255,45,85,0.2)",
                }}
            >
                <span className="text-2xl">🆘</span>
                <span className="text-xs">
                    {sosActive ? "ACTIVE" : confirming ? `${countdown}s` : "SOS"}
                </span>
            </button>

            {confirming && (
                <button
                    onClick={handleCancel}
                    className="text-xs text-white/50 hover:text-white underline"
                >
                    Cancel
                </button>
            )}

            {sosActive && (
                <p className="text-xs text-tempest-red font-display text-center animate-pulse">
                    Emergency sent • Tap to cancel
                </p>
            )}
        </div>
    );
}