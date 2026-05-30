"use client";
// components/ui/SettingsPanel.tsx
// Full-screen settings drawer with theme toggle and map preferences

import { X, Moon, Sun, Palette, Map, Bell, Shield, Info, ChevronRight, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import GlassPanel from "./GlassPanel";

interface SettingsPanelProps {
    onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
    const { theme, toggleTheme, user, mapSettings, updateMapSettings } = useAppStore();
    const isDark = theme === "dark";

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg-primary)" }}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 pt-4 pb-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                <h2 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                    Settings
                </h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                    style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
                >
                    <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

                {/* Profile */}
                <GlassPanel className="p-4" rounded="2xl">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-lg flex-shrink-0"
                            style={{
                                background: `${user.avatarColor}20`,
                                border: `2px solid ${user.avatarColor}`,
                                color: user.avatarColor,
                                boxShadow: `0 0 16px ${user.avatarColor}40`,
                            }}
                        >
                            {user.avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
                                {user.displayName}
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {user.email ?? "Not signed in"}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    </div>
                </GlassPanel>

                {/* Appearance */}
                <section>
                    <p
                        className="text-xs font-display font-semibold uppercase tracking-wider mb-2 px-1"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Appearance
                    </p>
                    <GlassPanel rounded="2xl" className="overflow-hidden">
                        {/* Theme toggle */}
                        <div
                            className="flex items-center justify-between px-4 py-3.5"
                            style={{ borderBottom: "1px solid var(--border-subtle)" }}
                        >
                            <div className="flex items-center gap-3">
                                {isDark
                                    ? <Moon className="w-5 h-5 text-tempest-cyan" />
                                    : <Sun className="w-5 h-5 text-tempest-yellow" />
                                }
                                <div>
                                    <p className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                        Theme
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {isDark ? "Dark (AMOLED)" : "Light mode"}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle pill */}
                            <button
                                onClick={toggleTheme}
                                className="relative w-14 h-7 rounded-full transition-all duration-300 active:scale-95"
                                style={{
                                    background: isDark
                                        ? "rgba(0,212,255,0.25)"
                                        : "rgba(255,107,0,0.25)",
                                    border: `1.5px solid ${isDark ? "#00D4FF" : "#FF6B00"}`,
                                }}
                            >
                                <div
                                    className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
                                    style={{
                                        left: isDark ? "calc(100% - 1.6rem)" : "2px",
                                        background: isDark ? "#00D4FF" : "#FF6B00",
                                        boxShadow: `0 0 8px ${isDark ? "#00D4FF" : "#FF6B00"}80`,
                                    }}
                                >
                                    {isDark
                                        ? <Moon className="w-3 h-3 text-black" />
                                        : <Sun className="w-3 h-3 text-white" />
                                    }
                                </div>
                            </button>
                        </div>

                        {/* Map style */}
                        <div className="px-4 py-3.5">
                            <div className="flex items-center gap-3 mb-3">
                                <Map className="w-5 h-5 text-tempest-green" />
                                <p className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                    Map Style
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {(["dark", "satellite", "terrain"] as const).map((s) => {
                                    const labels = { dark: "🌙 Night", satellite: "🛰️ Satellite", terrain: "⛰️ Terrain" };
                                    const active = mapSettings.style === s;
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => updateMapSettings({ style: s })}
                                            className={cn(
                                                "h-12 rounded-xl text-xs font-display font-semibold transition-all active:scale-95",
                                                active ? "text-black" : "text-[var(--text-secondary)]"
                                            )}
                                            style={
                                                active
                                                    ? { background: "#00D4FF", boxShadow: "0 0 12px rgba(0,212,255,0.4)" }
                                                    : { background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }
                                            }
                                        >
                                            {labels[s]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </GlassPanel>
                </section>

                {/* POI Overlays */}
                <section>
                    <p
                        className="text-xs font-display font-semibold uppercase tracking-wider mb-2 px-1"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Map Overlays
                    </p>
                    <GlassPanel rounded="2xl" className="overflow-hidden divide-y divide-[var(--border-subtle)]">
                        {[
                            { key: "showPetrolPumps", label: "Fuel Stations", icon: "⛽", color: "#FF9F0A" },
                            { key: "showMechanics", label: "Mechanics", icon: "🔧", color: "#BF5AF2" },
                            { key: "showHospitals", label: "Hospitals", icon: "🏥", color: "#FF2D55" },
                            { key: "showFoodStops", label: "Food & Dhabas", icon: "🍽️", color: "#00FF88" },
                            { key: "showScenicSpots", label: "Scenic Spots", icon: "📍", color: "#FFD60A" },
                        ].map(({ key, label, icon, color }) => {
                            const active = mapSettings[key as keyof typeof mapSettings] as boolean;
                            return (
                                <div key={key} className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{icon}</span>
                                        <span className="font-body text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
                                    </div>
                                    <button
                                        onClick={() => updateMapSettings({ [key]: !active })}
                                        className="relative w-12 h-6 rounded-full transition-all duration-300 active:scale-95"
                                        style={{
                                            background: active ? `${color}30` : "var(--glass-bg)",
                                            border: `1.5px solid ${active ? color : "var(--border-default)"}`,
                                        }}
                                    >
                                        <div
                                            className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
                                            style={{
                                                left: active ? "calc(100% - 1.4rem)" : "2px",
                                                background: active ? color : "var(--text-muted)",
                                            }}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </GlassPanel>
                </section>

                {/* About */}
                <GlassPanel className="p-4 flex items-center gap-3" rounded="2xl">
                    <Info className="w-5 h-5 text-tempest-cyan flex-shrink-0" />
                    <div>
                        <p className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            Tempest v1.0.0
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Motorcycle Companion · 2026
                        </p>
                    </div>
                </GlassPanel>

            </div>
        </div>
    );
}