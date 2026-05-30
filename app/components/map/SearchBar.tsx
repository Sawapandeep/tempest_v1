"use client";
// components/map/SearchBar.tsx
// High-contrast search bar — fully opaque on any map tile, any theme
import { useState, useRef } from "react";
import { Search, X, Mic, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
    { name: "Manali, Himachal Pradesh", type: "City", icon: "🏔️", lat: 32.2396, lng: 77.1887 },
    { name: "Leh, Ladakh", type: "City", icon: "🏕️", lat: 34.1526, lng: 77.5771 },
    { name: "Spiti Valley", type: "Region", icon: "🌄", lat: 32.2461, lng: 78.0358 },
    { name: "Rohtang Pass", type: "Mountain Pass", icon: "⛰️", lat: 32.3723, lng: 77.2433 },
    { name: "Chandigarh", type: "City", icon: "🏙️", lat: 30.7333, lng: 76.7794 },
    { name: "Tiger's Nest, Paro", type: "Scenic Spot", icon: "🐯", lat: 27.4912, lng: 89.3636 },
];

export default function SearchBar() {
    const { isSearchOpen, setIsSearchOpen, startNavigation } = useAppStore();
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.length > 1
        ? SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        : SUGGESTIONS;

    const handleSelect = (s: (typeof SUGGESTIONS)[0]) => {
        startNavigation({ lat: s.lat, lng: s.lng, name: s.name });
        setQuery("");
        setIsSearchOpen(false);
    };

    // Always-opaque base — works on any map tile type or theme
    const panelBase: React.CSSProperties = {
        background: "var(--search-bg, rgba(14,14,14,0.97))",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1.5px solid var(--search-border, rgba(255,255,255,0.14))",
        boxShadow: "0 4px 32px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.06) inset",
    };

    return (
        <div className="relative">
            {/* Trigger / Input row */}
            <div
                className={cn(
                    "flex items-center gap-3 px-4 h-14 cursor-pointer transition-all duration-200",
                    isSearchOpen ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"
                )}
                style={panelBase}
                onClick={() => {
                    setIsSearchOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
            >
                <Search className="w-5 h-5 text-tempest-cyan flex-shrink-0" />

                {isSearchOpen ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search destination, POI…"
                        className="flex-1 bg-transparent outline-none font-body text-base"
                        style={{ color: "var(--text-primary, #FFFFFF)" }}
                    />
                ) : (
                    <span className="flex-1 font-body text-base select-none" style={{ color: "rgba(255,255,255,0.45)" }}>
                        Search destination…
                    </span>
                )}

                {isSearchOpen ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSearchOpen(false); setQuery(""); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                        style={{ background: "rgba(255,255,255,0.10)" }}
                    >
                        <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
                    </button>
                ) : (
                    <Mic className="w-5 h-5" style={{ color: "rgba(255,255,255,0.35)" }} />
                )}
            </div>

            {/* Dropdown — flush with trigger, same opaque style */}
            {isSearchOpen && (
                <div
                    className="absolute top-full left-0 right-0 overflow-hidden z-50 animate-slide-up"
                    style={{
                        ...panelBase,
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                    }}
                >
                    <div className="py-1.5">
                        {filtered.length === 0 && (
                            <div className="px-4 py-4 text-sm font-body" style={{ color: "rgba(255,255,255,0.35)" }}>
                                No results for "{query}"
                            </div>
                        )}
                        {filtered.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelect(s)}
                                className="w-full flex items-center gap-3 px-4 py-3 active:scale-[0.98] transition-all text-left group"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                }}
                            >
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                                    style={{
                                        background: "rgba(0,212,255,0.10)",
                                        border: "1px solid rgba(0,212,255,0.22)",
                                    }}
                                >
                                    {s.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-body text-sm leading-tight font-medium truncate" style={{ color: "#FFFFFF" }}>
                                        {s.name}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.type}</p>
                                </div>
                                <MapPin className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-tempest-cyan" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
