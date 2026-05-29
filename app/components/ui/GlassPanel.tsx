"use client";
// components/ui/GlassPanel.tsx

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
            subtle: "bg-white/[0.02] backdrop-blur-md border border-white/[0.04]",
        };

        const glowClasses = {
            cyan: "shadow-[0_0_24px_rgba(0,212,255,0.15)]",
            orange: "shadow-[0_0_24px_rgba(255,107,0,0.15)]",
            green: "shadow-[0_0_24px_rgba(0,255,136,0.15)]",
            red: "shadow-[0_0_24px_rgba(255,45,85,0.2)]",
            none: "",
        };

        const roundedClasses = {
            lg: "rounded-lg",
            xl: "rounded-xl",
            "2xl": "rounded-2xl",
            "3xl": "rounded-3xl",
            "4xl": "rounded-[2rem]",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    variantClasses[variant],
                    glowClasses[glow],
                    roundedClasses[rounded],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassPanel.displayName = "GlassPanel";
export default GlassPanel;