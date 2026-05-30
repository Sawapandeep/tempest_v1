"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X, Mic, Navigation, Clock, ArrowLeft, MapPin, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchResult {
    name: string;
    displayName: string;
    type: string;
    icon: string;
    lat: number;
    lng: number;
}

// ─── Category chips (Google Maps style) ──────────────────────────────────────
const CATEGORY_CHIPS = [
    { id: "ask", label: "Ask Maps", icon: "✨", special: true },
    { id: "restaurants", label: "Restaurants", icon: "🍽️" },
    { id: "petrol", label: "Petrol", icon: "⛽" },
    { id: "hotels", label: "Hotels", icon: "🏨" },
    { id: "hospitals", label: "Hospitals", icon: "🏥" },
    { id: "atm", label: "ATM", icon: "🏧" },
];

// ─── Geocoder ─────────────────────────────────────────────────────────────────
async function geocode(query: string): Promise<SearchResult[]> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        return data.map((item: {
            display_name: string; type: string; lat: string; lon: string;
            class?: string; importance?: number;
        }) => {
            const parts = item.display_name.split(", ");
            const name = parts[0];
            const icons: Record<string, string> = {
                city: "🏙️", town: "🏘️", village: "🏡", mountain_pass: "⛰️", peak: "🗻",
                administrative: "📍", natural: "🌿", tourism: "🎯", amenity: "🔵",
                road: "🛣️", suburb: "🏘️", state: "📍", country: "🌍",
            };
            return {
                name,
                displayName: item.display_name,
                type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                icon: icons[item.type] ?? "📍",
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            };
        });
    } catch { return []; }
}

// ─── PlaceDetailSheet (like Google Maps bottom sheet after tapping a result) ──
interface PlaceDetailProps {
    place: SearchResult;
    onClose: () => void;
    onDirections: (place: SearchResult) => void;
}

function PlaceDetailSheet({ place, onClose, onDirections }: PlaceDetailProps) {
    return (
        <div
            className="absolute bottom-0 left-0 right-0 z-50 animate-slide-up"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div style={{
                background: "#1A1A1A",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
            }}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="px-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="font-display font-bold text-white text-2xl leading-tight">{place.name}</h2>
                        <p className="text-white/50 text-sm mt-0.5 capitalize">{place.type}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.10)" }}>
                            <X className="w-4 h-4 text-white/70" />
                        </button>
                    </div>
                </div>

                {/* Action buttons row — Google Maps style */}
                <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                    {/* Primary: Directions */}
                    <button
                        onClick={() => onDirections(place)}
                        className="flex items-center gap-2 px-5 h-11 rounded-full font-display font-semibold text-sm flex-shrink-0 active:scale-95 transition-all"
                        style={{ background: "#00A67E", color: "#fff" }}>
                        <Navigation className="w-4 h-4" />
                        Directions
                    </button>

                    {/* Secondary buttons */}
                    {[
                        { icon: "🔖", label: "Save" },
                        { icon: "↗️", label: "Share" },
                        { icon: "···", label: "More" },
                    ].map((btn) => (
                        <button key={btn.label}
                            className="flex items-center gap-2 px-4 h-11 rounded-full font-display font-semibold text-sm flex-shrink-0 active:scale-95 transition-all"
                            style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)" }}>
                            <span className="text-base">{btn.icon}</span>
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 16px" }} />

                {/* Address row */}
                <div className="px-4 py-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                    <p className="text-white/60 text-sm leading-relaxed font-body">{place.displayName}</p>
                </div>
            </div>
        </div>
    );
}

// ─── RoutePreviewSheet (before tapping Start — like Image 4) ─────────────────
interface RoutePreviewProps {
    place: SearchResult;
    onStart: () => void;
    onClose: () => void;
}

function RoutePreviewSheet({ place, onStart, onClose }: RoutePreviewProps) {
    const [routeData, setRouteData] = useState<{ dist: number; dur: number } | null>(null);
    const { myLocation } = useAppStore();

    useEffect(() => {
        if (!myLocation) return;
        const url = `https://router.project-osrm.org/route/v1/driving/${myLocation.lng},${myLocation.lat};${place.lng},${place.lat}?overview=false`;
        fetch(url).then(r => r.json()).then(d => {
            if (d.routes?.[0]) {
                setRouteData({ dist: d.routes[0].distance / 1000, dur: d.routes[0].duration / 60 });
            }
        }).catch(() => { });
    }, [place, myLocation]);

    const formatDur = (min: number) => {
        if (min < 60) return `${Math.round(min)} min`;
        const h = Math.floor(min / 60);
        const m = Math.round(min % 60);
        return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 z-50 animate-slide-up"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div style={{
                background: "#1A1A1A",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
            }}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* From / To row */}
                <div className="px-4 pb-3 flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-3 h-3 rounded-full border-2 border-[#4285F4] bg-transparent" />
                        <div className="w-px h-4 bg-white/20" />
                        <div className="w-3 h-3 rounded-full bg-[#EA4335]" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                            <span className="text-white/50 text-sm font-body">Your location</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                            <span className="text-white text-sm font-body font-semibold truncate">{place.name}</span>
                        </div>
                    </div>
                    <button className="w-9 h-9 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span style={{ fontSize: 18 }}>⇅</span>
                    </button>
                </div>

                {/* Transport mode tabs */}
                <div className="px-4 pb-3">
                    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                        {[
                            { icon: "🚗", label: routeData ? formatDur(routeData.dur * 1.05) : "—", active: false },
                            { icon: "🏍️", label: routeData ? formatDur(routeData.dur) : "—", active: true },
                            { icon: "🚌", label: routeData ? formatDur(routeData.dur * 1.2) : "—", active: false },
                            { icon: "🚶", label: routeData ? formatDur(routeData.dur * 12) : "2 days", active: false },
                        ].map((tab, i) => (
                            <button key={i}
                                className="flex-1 flex flex-col items-center py-2 rounded-xl transition-all text-xs font-display font-semibold"
                                style={{
                                    background: tab.active ? "rgba(0,166,126,0.20)" : "transparent",
                                    color: tab.active ? "#00A67E" : "rgba(255,255,255,0.45)",
                                    border: tab.active ? "1px solid rgba(0,166,126,0.40)" : "1px solid transparent",
                                }}>
                                <span className="text-base mb-0.5">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Route info */}
                {routeData && (
                    <div className="mx-4 mb-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(0,166,126,0.12)", border: "1px solid rgba(0,166,126,0.25)" }}>
                        <div className="flex items-baseline gap-2">
                            <span className="font-display font-black text-[#00A67E] text-2xl">{formatDur(routeData.dur)}</span>
                            <span className="text-white/40 text-sm">·</span>
                            <span className="text-white/60 text-sm">{routeData.dist.toFixed(0)} km</span>
                        </div>
                        <p className="text-white/40 text-xs mt-0.5 font-body">Fastest route · via NH44</p>
                    </div>
                )}

                {/* Bottom action row */}
                <div className="px-4 pb-5 flex gap-2">
                    <button
                        onClick={onStart}
                        className="flex-1 h-12 rounded-full font-display font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all"
                        style={{ background: "#00A67E", color: "#fff" }}>
                        <Navigation className="w-4 h-4" />
                        Start
                    </button>
                    <button
                        className="h-12 px-5 rounded-full font-display font-semibold text-sm active:scale-95 transition-all"
                        style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)" }}>
                        Add stops
                    </button>
                    <button onClick={onClose}
                        className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95"
                        style={{ background: "rgba(255,255,255,0.10)" }}>
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main SearchBar ───────────────────────────────────────────────────────────
export type SearchMode = "idle" | "searching" | "place_detail" | "route_preview";

interface SearchBarProps {
    onShowSettings: () => void;
}

export default function SearchBar({ onShowSettings }: SearchBarProps) {
    const { isSearchOpen, setIsSearchOpen, startNavigation, user } = useAppStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<SearchMode>("idle");
    const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const res = await geocode(query);
            setResults(res);
            setLoading(false);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const handleSelectResult = (s: SearchResult) => {
        setSelectedPlace(s);
        setMode("place_detail");
        setQuery("");
        setResults([]);
        setIsSearchOpen(false);
    };

    const handleDirections = (place: SearchResult) => {
        setMode("route_preview");
    };

    const handleStart = () => {
        if (!selectedPlace) return;
        startNavigation({ lat: selectedPlace.lat, lng: selectedPlace.lng, name: selectedPlace.name });
        setMode("idle");
        setSelectedPlace(null);
    };

    const handleClose = () => {
        setMode("idle");
        setSelectedPlace(null);
        setIsSearchOpen(false);
        setQuery("");
    };

    const openSearch = () => {
        setMode("searching");
        setIsSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const panelBg: React.CSSProperties = {
        background: "rgba(26,26,26,0.97)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
    };

    // ── Render sheets ──────────────────────────────────────────────
    if (mode === "place_detail" && selectedPlace) {
        return (
            <>
                <PlaceDetailSheet
                    place={selectedPlace}
                    onClose={handleClose}
                    onDirections={handleDirections}
                />
            </>
        );
    }

    if (mode === "route_preview" && selectedPlace) {
        return (
            <RoutePreviewSheet
                place={selectedPlace}
                onStart={handleStart}
                onClose={handleClose}
            />
        );
    }

    // ── Idle / searching ───────────────────────────────────────────
    return (
        <div className="flex flex-col gap-2">
            {/* Search bar row */}
            <div className="flex items-center gap-2">
                {/* Search pill */}
                <div
                    className={cn(
                        "flex-1 flex items-center gap-3 px-4 h-14 cursor-pointer transition-all duration-200",
                        isSearchOpen ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"
                    )}
                    style={panelBg}
                    onClick={openSearch}
                >
                    {/* Google Maps-style pin/search icon */}
                    {isSearchOpen ? (
                        <button onClick={(e) => { e.stopPropagation(); handleClose(); }}
                            className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                            <ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                    ) : (
                        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                            <Search className="w-5 h-5 text-white/50" />
                        </div>
                    )}

                    {isSearchOpen ? (
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search here"
                            className="flex-1 bg-transparent outline-none font-body text-base text-white placeholder:text-white/40"
                            autoComplete="off"
                        />
                    ) : (
                        <span className="flex-1 font-body text-base text-white/45 select-none">Search here</span>
                    )}

                    {isSearchOpen ? (
                        loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
                        ) : (
                            <Mic className="w-5 h-5 text-white/40 flex-shrink-0" />
                        )
                    ) : (
                        <Mic className="w-5 h-5 text-white/35 flex-shrink-0" />
                    )}
                </div>

                {/* Avatar / profile button (replaces Settings tab) */}
                <button
                    onClick={onShowSettings}
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                    style={{
                        ...panelBg,
                        background: `${user.avatarColor}22`,
                        border: `2px solid ${user.avatarColor}60`,
                    }}
                >
                    <span className="font-display font-bold text-sm" style={{ color: user.avatarColor }}>
                        {user.avatarInitials}
                    </span>
                </button>
            </div>

            {/* Search dropdown */}
            {isSearchOpen && (
                <div
                    className="absolute left-3 right-3 z-50 overflow-hidden rounded-b-2xl"
                    style={{
                        ...panelBg,
                        top: "calc(env(safe-area-inset-top) + 3rem + 3.6rem)",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        maxHeight: "55vh",
                        overflowY: "auto",
                    }}
                >
                    {query.length >= 2 && results.length > 0 && (
                        <div className="py-1">
                            {results.map((s, i) => (
                                <button key={i} onClick={() => handleSelectResult(s)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5"
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                                        style={{ background: "rgba(255,255,255,0.08)" }}>
                                        {s.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold font-body truncate">{s.name}</p>
                                        <p className="text-white/40 text-xs truncate mt-0.5 font-body">{s.displayName}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {query.length >= 2 && !loading && results.length === 0 && (
                        <div className="px-4 py-6 text-center">
                            <p className="text-white/35 text-sm font-body">No results for "{query}"</p>
                        </div>
                    )}

                    {query.length < 2 && (
                        <div className="py-2">
                            <div className="px-4 pt-2 pb-1 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-[10px] font-display uppercase tracking-wider text-white/30">Recent searches</span>
                            </div>
                            {[
                                { name: "Manali", icon: "🏔️", sub: "Himachal Pradesh, India" },
                                { name: "Chandigarh", icon: "🏙️", sub: "Punjab, India" },
                                { name: "Leh", icon: "🏕️", sub: "Ladakh, India" },
                            ].map((s, i) => (
                                <button key={i}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                    onClick={() => handleSelectResult({ name: s.name, displayName: s.sub, type: "City", icon: s.icon, lat: 0, lng: 0 })}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: "rgba(255,255,255,0.07)" }}>
                                        <Clock className="w-4 h-4 text-white/40" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold font-body">{s.name}</p>
                                        <p className="text-white/35 text-xs font-body">{s.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Category chips — only when not searching */}
            {!isSearchOpen && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                    {CATEGORY_CHIPS.map((chip) => (
                        <button key={chip.id}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-display font-semibold transition-all active:scale-95"
                            style={chip.special ? {
                                background: "rgba(66,133,244,0.18)",
                                border: "1.5px solid rgba(66,133,244,0.45)",
                                color: "#7AB4FF",
                            } : {
                                background: "rgba(26,26,26,0.95)",
                                backdropFilter: "blur(16px)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.75)",
                            }}>
                            <span className="text-sm">{chip.icon}</span>
                            <span>{chip.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}