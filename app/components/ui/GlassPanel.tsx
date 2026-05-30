"use client";
// components/ui/GlassPanel.tsx
// Theme-aware glass panel — works in both dark and light mode via CSS vars

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "strong" | "subtle";
    glow?: "cyan" | "orange" | "green" | "red" | "none";
    rounded?: "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
    ({ className, variant = "default", glow = "none", rounded = "2xl", children, ...props }, ref) => {
        const variantClasses = {
            default: "glass",
            strong: "glass-strong",
            // subtle uses inline CSS vars so it responds to .light
            subtle: "",
        };

        const glowClasses = {
            cyan: "shadow-[0_0_24px_rgba(0,212,255,0.18)]",
            orange: "shadow-[0_0_24px_rgba(255,107,0,0.18)]",
            green: "shadow-[0_0_24px_rgba(0,255,136,0.18)]",
            red: "shadow-[0_0_24px_rgba(255,45,85,0.25)]",
            none: "",
        };

        const roundedClasses = {
            lg: "rounded-lg",
            xl: "rounded-xl",
            "2xl": "rounded-2xl",
            "3xl": "rounded-3xl",
            "4xl": "rounded-[2rem]",
        };

        const subtleStyle = variant === "subtle"
            ? {
                background: "var(--glass-bg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--glass-border)",
            } as React.CSSProperties
            : undefined;

        return (
            <div
                ref={ref}
                className={cn(
                    variantClasses[variant],
                    glowClasses[glow],
                    roundedClasses[rounded],
                    className
                )}
                style={subtleStyle}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassPanel.displayName = "GlassPanel";
export default GlassPanel;