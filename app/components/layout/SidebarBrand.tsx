"use client";
// src/components/layout/SidebarBrand.tsx

import { motion } from "framer-motion";

export function SidebarBrand() {
    return (
        <div className="flex items-center gap-3 px-4 py-4">
            {/* Logo mark */}
            <div className="relative w-8 h-8 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-tempest-500/20 border border-tempest-500/30" />
                <motion.div
                    className="absolute inset-1.5 rounded-lg border border-tempest-400/60"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-tempest-400 shadow-[0_0_6px_rgba(42,159,240,0.8)]" />
                </div>
            </div>

            {/* Brand text */}
            <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
                    Tempest <span className="text-tempest-400">Maps</span>
                </h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wider uppercase">
                    Open Platform
                </p>
            </div>
        </div>
    );
}