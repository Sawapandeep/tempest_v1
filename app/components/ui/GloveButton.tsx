"use client";
// components/ui/GloveButton.tsx

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GloveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "cyan" | "orange";
    size?: "sm" | "md" | "lg" | "xl";
    glow?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    loading?: boolean;
    fullWidth?: boolean;
}

const GloveButton = forwardRef<HTMLButtonElement, GloveButtonProps>(
    (
        {
            className, variant = "primary", size = "md", glow = false,
            icon, iconPosition = "left", loading = false, fullWidth = false,
            children, disabled, ...props
        },
        ref
    ) => {
        const sizeClasses = {
            sm: "min-h-[44px] px-4 text-sm  gap-2 rounded-xl",
            md: "min-h-[56px] px-6 text-base gap-3 rounded-2xl",
            lg: "min-h-[64px] px-8 text-lg  gap-3 rounded-2xl",
            xl: "min-h-[72px] px-10 text-xl  gap-4 rounded-3xl",
        };

        // Brand colours are fixed; only "secondary/ghost/outline" need theme awareness
        const variantClasses: Record<string, string> = {
            primary: "bg-tempest-cyan  text-black          font-bold hover:opacity-90 active:opacity-80",
            secondary: "glass            text-[var(--text-primary)] hover:opacity-90",
            danger: "bg-tempest-red   text-white           font-bold hover:bg-red-500  active:bg-red-600",
            ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 active:bg-white/10",
            outline: "border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-white/5",
            cyan: "bg-tempest-cyan/10  text-tempest-cyan  border border-tempest-cyan/30  hover:bg-tempest-cyan/20  font-semibold",
            orange: "bg-tempest-orange/10 text-tempest-orange border border-tempest-orange/30 hover:bg-tempest-orange/20 font-semibold",
        };

        const glowClass = glow
            ? variant === "primary" || variant === "cyan"
                ? "shadow-[0_0_20px_rgba(0,212,255,0.35)]"
                : variant === "orange"
                    ? "shadow-[0_0_20px_rgba(255,107,0,0.35)]"
                    : variant === "danger"
                        ? "shadow-[0_0_20px_rgba(255,45,85,0.35)]"
                        : ""
            : "";

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "btn-glove flex items-center justify-center",
                    "font-display font-semibold select-none cursor-pointer",
                    "transition-all duration-200 active:scale-95",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
                    sizeClasses[size],
                    variantClasses[variant],
                    glowClass,
                    fullWidth && "w-full",
                    className
                )}
                {...props}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {children}
                    </span>
                ) : (
                    <>
                        {icon && iconPosition === "left" && icon}
                        {children}
                        {icon && iconPosition === "right" && icon}
                    </>
                )}
            </button>
        );
    }
);

GloveButton.displayName = "GloveButton";
export default GloveButton;