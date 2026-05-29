"use client";
// components/map/SearchBar.tsx

import { useState, useRef } from "react";
import { Search, X, Mic } from "lucide-react";
import GlassPanel from "../ui/GlassPanel";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Mock search suggestions for demo
const SUGGESTIONS = [
    { name: "Manali, Himachal Pradesh", type: "City", lat: 32.2396, lng: 77.1887 },
    { name: "Leh, Ladakh", type: "City", lat: 34.1526, lng: 77.5771 },
    { name: "Spiti Valley", type: "Region", lat: 32.2461, lng: 78.0358 },
    { name: "Rohtang Pass", type: "Mountain Pass", lat: 32.3723, lng: 77.2433 },
    { name: "Tiger's Nest, Paro", type: "Scenic Spot", lat: 27.4912, lng: 89.3636 },
];

export default function SearchBar() {
    const { isSearchOpen, setIsSearchOpen, startNavigation } = useAppStore();
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.length > 1
        ? SUGGESTIONS.filter((s) =>
            s.name.toLowerCase().includes(query.toLowerCase())
        )
        : SUGGESTIONS;

    const handleSelect = (s: typeof SUGGESTIONS[0]) => {
        startNavigation({ lat: s.lat, lng: s.lng, name: s.name });
        setQuery("");
        setIsSearchOpen(false);
    };

    return (
        <div className="relative">
            {/* Search trigger */}
            <GlassPanel
                className={cn(
                    "flex items-center gap-3 px-4 h-14 cursor-pointer",
                    "transition-all duration-200",
                    isSearchOpen ? "rounded-t-2xl rounded-b-none border-b-0" : "rounded-2xl"
                )}
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
                        placeholder="Search destination, POI..."
                        className="flex-1 bg-transparent outline-none text-white placeholder-white/30 font-body text-base"
                    />
                ) : (
                    <span className="flex-1 text-white/40 font-body text-base">
                        Search destination...
                    </span>
                )}
                {isSearchOpen ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSearchOpen(false);
                            setQuery("");
                        }}
                        className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center active:scale-95"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                ) : (
                    <Mic className="w-5 h-5 text-white/30" />
                )}
            </GlassPanel>

            {/* Dropdown results */}
            {isSearchOpen && (
                <GlassPanel
                    className="absolute top-full left-0 right-0 rounded-t-none rounded-b-2xl overflow-hidden z-50 border-t-0"
                    style={{ backdropFilter: "blur(40px)" }}
                >
                    <div className="py-1">
                        {filtered.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelect(s)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3",
                                    "hover:bg-white/8 active:bg-white/12 transition-colors",
                                    "text-left"
                                )}
                            >
                                <div className="w-9 h-9 rounded-xl bg-tempest-cyan/10 border border-tempest-cyan/20 flex items-center justify-center flex-shrink-0">
                                    <Search className="w-4 h-4 text-tempest-cyan" />
                                </div>
                                <div>
                                    <p className="text-white font-body text-sm leading-tight">{s.name}</p>
                                    <p className="text-white/40 text-xs">{s.type}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </GlassPanel>
            )}
        </div>
    );
}