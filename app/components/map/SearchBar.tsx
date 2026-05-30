"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X, Mic, MapPin, Navigation, Clock, TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface SearchResult {
    name: string;
    displayName: string;
    type: string;
    icon: string;
    lat: number;
    lng: number;
}

const RECENT_SEARCHES: SearchResult[] = [
    { name: "Manali", displayName: "Manali, Himachal Pradesh, India", type: "City", icon: "🏔️", lat: 32.2396, lng: 77.1887 },
    { name: "Leh", displayName: "Leh, Ladakh, India", type: "City", icon: "🏕️", lat: 34.1526, lng: 77.5771 },
];

const POPULAR: SearchResult[] = [
    { name: "Rohtang Pass", displayName: "Rohtang Pass, Himachal Pradesh", type: "Mountain Pass", icon: "⛰️", lat: 32.3723, lng: 77.2433 },
    { name: "Spiti Valley", displayName: "Spiti Valley, Himachal Pradesh", type: "Region", icon: "🌄", lat: 32.2461, lng: 78.0358 },
    { name: "Chandigarh", displayName: "Chandigarh, India", type: "City", icon: "🏙️", lat: 30.7333, lng: 76.7794 },
];

async function geocode(query: string): Promise<SearchResult[]> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        return data.map((item: {
            display_name: string;
            type: string;
            lat: string;
            lon: string;
            address?: { road?: string; city?: string; state?: string; country?: string };
        }) => {
            const parts = item.display_name.split(", ");
            const name = parts[0];
            const type = item.type;
            const icons: Record<string, string> = {
                city: "🏙️", town: "🏘️", village: "🏡", mountain_pass: "⛰️", peak: "🗻",
                administrative: "📍", natural: "🌿", tourism: "🎯", amenity: "🔵",
            };
            return {
                name,
                displayName: item.display_name,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                icon: icons[type] ?? "📍",
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            };
        });
    } catch {
        return [];
    }
}

export default function SearchBar() {
    const { isSearchOpen, setIsSearchOpen, startNavigation } = useAppStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const res = await geocode(query);
            setResults(res);
            setLoading(false);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const handleSelect = (s: SearchResult) => {
        startNavigation({ lat: s.lat, lng: s.lng, name: s.name });
        setQuery("");
        setResults([]);
        setIsSearchOpen(false);
    };

    const panelBase: React.CSSProperties = {
        background: "rgba(14,14,14,0.97)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1.5px solid rgba(255,255,255,0.14)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.06) inset",
    };

    const displayItems = query.length >= 2 ? results : isSearchOpen ? [] : [];
    const showRecent = isSearchOpen && query.length < 2;

    return (
        <div className="relative">
            {/* Search input row */}
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
                {loading
                    ? <div className="w-5 h-5 border-2 border-tempest-cyan/30 border-t-tempest-cyan rounded-full animate-spin flex-shrink-0" />
                    : <Search className="w-5 h-5 text-tempest-cyan flex-shrink-0" />
                }
                {isSearchOpen ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search destination, place, POI…"
                        className="flex-1 bg-transparent outline-none font-body text-base text-white"
                        autoComplete="off"
                    />
                ) : (
                    <span className="flex-1 font-body text-base select-none text-white/40">
                        Where to?
                    </span>
                )}
                {isSearchOpen ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSearchOpen(false); setQuery(""); setResults([]); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                        style={{ background: "rgba(255,255,255,0.10)" }}
                    >
                        <X className="w-4 h-4 text-white/70" />
                    </button>
                ) : (
                    <Mic className="w-5 h-5 text-white/35" />
                )}
            </div>

            {/* Dropdown */}
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
                        maxHeight: "60vh",
                        overflowY: "auto",
                    }}
                >
                    {/* Search results */}
                    {displayItems.length > 0 && (
                        <div className="py-1.5">
                            {displayItems.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(s)}
                                    className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left active:scale-[0.98]"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                                        style={{ background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.25)" }}>
                                        {s.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-body text-sm font-semibold truncate text-white">{s.name}</p>
                                        <p className="text-xs mt-0.5 text-white/40 truncate">{s.displayName}</p>
                                    </div>
                                    <Navigation className="w-4 h-4 flex-shrink-0 text-tempest-cyan opacity-50" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results */}
                    {query.length >= 2 && !loading && results.length === 0 && (
                        <div className="px-4 py-5 text-center">
                            <p className="text-sm text-white/40 font-body">No results for "{query}"</p>
                        </div>
                    )}

                    {/* Recent & Popular */}
                    {showRecent && (
                        <div className="py-2">
                            {RECENT_SEARCHES.length > 0 && (
                                <>
                                    <div className="px-4 py-2 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-white/30" />
                                        <span className="text-[10px] font-display uppercase tracking-wider text-white/30">Recent</span>
                                    </div>
                                    {RECENT_SEARCHES.map((s, i) => (
                                        <button key={i} onClick={() => handleSelect(s)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                                            style={{ background: "transparent" }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                                                style={{ background: "rgba(255,255,255,0.07)" }}>
                                                {s.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-body text-sm text-white/80 truncate">{s.name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}
                            <div className="px-4 py-2 flex items-center gap-2 mt-1">
                                <TrendingUp className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-[10px] font-display uppercase tracking-wider text-white/30">Popular Routes</span>
                            </div>
                            {POPULAR.map((s, i) => (
                                <button key={i} onClick={() => handleSelect(s)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                                    style={{ background: "transparent" }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                                        style={{ background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.20)" }}>
                                        {s.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-body text-sm text-white/80 truncate">{s.name}</p>
                                        <p className="text-xs text-white/35 truncate">{s.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}