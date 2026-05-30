"use client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    Navigation, Layers, Wind, Thermometer, Eye, Plus, Minus,
    X, ChevronUp, ChevronDown, Clock, Route, AlertTriangle,
    Car, Bike, Train, Footprints, Leaf,
    Map, Users, Music, Settings as SettingsIcon,
    Search, Mic, ChevronRight, TrendingUp,
    Fuel, Wrench, Hospital, UtensilsCrossed, Camera,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import SpeedWidget from "@/app/components/ui/SpeedWidget";
import CompassWidget from "@/app/components/ui/CompassWidget";
import SOSButton from "@/app/components/ui/SOSButton";
import POIFilterBar from "@/app/components/map/POIFilterBar";

const MapView = dynamic(() => import("@/app/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center" style={{ background: "#000" }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-tempest-cyan/30 border-t-tempest-cyan rounded-full animate-spin" />
                <p className="font-display text-sm text-white/40">Loading map…</p>
            </div>
        </div>
    ),
});

const LAYER_OPTIONS = [
    { id: "dark", emoji: "🌙", label: "Night" },
    { id: "satellite", emoji: "🛰️", label: "Satellite" },
    { id: "terrain", emoji: "⛰️", label: "Terrain" },
] as const;

const fabStyle: React.CSSProperties = {
    background: "rgba(10,10,10,0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)",
};

function formatDuration(min: number): string {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function formatDist(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

type SheetState = "collapsed" | "peek" | "expanded";

interface RouteOption {
    id: string;
    icon: React.ReactNode;
    label: string;
    duration: string;
    distance: string;
    note?: string;
    isFastest?: boolean;
    savesFuel?: boolean;
    color: string;
}

// Avatar menu panel
function AvatarMenuPanel({
    onClose,
    onNavigateTo,
    user,
}: {
    onClose: () => void;
    onNavigateTo: (tab: string) => void;
    user: ReturnType<typeof useAppStore>["user"] extends infer T ? T : never;
}) {
    const { mapSettings, updateMapSettings, theme, toggleTheme } = useAppStore();

    const menuStyle: React.CSSProperties = {
        background: "rgba(12,12,12,0.98)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1.5px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.9)",
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
            <div
                className="absolute top-16 right-3 left-3 rounded-3xl overflow-hidden animate-scale-in"
                style={menuStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Profile section */}
                <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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
                        <p className="font-display font-bold text-white text-base">{user.displayName}</p>
                        <p className="text-white/40 text-xs mt-0.5">{user.email ?? "Tempest Rider"}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Quick nav links */}
                <div className="grid grid-cols-3 gap-2 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {[
                        { id: "group", icon: <Users className="w-5 h-5" />, label: "Group", color: "#FF6B00" },
                        { id: "music", icon: <Music className="w-5 h-5" />, label: "Music", color: "#BF5AF2" },
                        { id: "settings", icon: <SettingsIcon className="w-5 h-5" />, label: "Settings", color: "#00FF88" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { onClose(); onNavigateTo(item.id); }}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-all"
                            style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}
                        >
                            <span style={{ color: item.color }}>{item.icon}</span>
                            <span className="text-xs font-display font-semibold" style={{ color: item.color }}>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Map style */}
                <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] font-display uppercase tracking-wider text-white/30 mb-3">Map Style</p>
                    <div className="grid grid-cols-3 gap-2">
                        {(["dark", "satellite", "terrain"] as const).map((s) => {
                            const labels = { dark: "🌙 Night", satellite: "🛰️ Satellite", terrain: "⛰️ Terrain" };
                            const active = mapSettings.style === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => updateMapSettings({ style: s })}
                                    className={cn("h-11 rounded-xl text-xs font-display font-semibold transition-all active:scale-95")}
                                    style={active
                                        ? { background: "#00D4FF", color: "#000", boxShadow: "0 0 12px rgba(0,212,255,0.4)" }
                                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.10)" }
                                    }
                                >
                                    {labels[s]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* POI toggles */}
                <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] font-display uppercase tracking-wider text-white/30 mb-3">Overlays</p>
                    <div className="flex flex-col gap-1">
                        {[
                            { key: "showPetrolPumps", label: "Fuel Stations", icon: "⛽", color: "#FF9F0A" },
                            { key: "showMechanics", label: "Mechanics", icon: "🔧", color: "#BF5AF2" },
                            { key: "showHospitals", label: "Hospitals", icon: "🏥", color: "#FF2D55" },
                            { key: "showFoodStops", label: "Food & Dhabas", icon: "🍽️", color: "#00FF88" },
                            { key: "showScenicSpots", label: "Scenic Spots", icon: "📍", color: "#FFD60A" },
                        ].map(({ key, label, icon, color }) => {
                            const active = mapSettings[key as keyof typeof mapSettings] as boolean;
                            return (
                                <div key={key} className="flex items-center justify-between py-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{icon}</span>
                                        <span className="font-body text-sm text-white/70">{label}</span>
                                    </div>
                                    <button
                                        onClick={() => updateMapSettings({ [key]: !active })}
                                        className="relative w-12 h-6 rounded-full transition-all duration-300 active:scale-95"
                                        style={{
                                            background: active ? `${color}30` : "rgba(255,255,255,0.08)",
                                            border: `1.5px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
                                        }}
                                    >
                                        <div
                                            className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
                                            style={{
                                                left: active ? "calc(100% - 1.4rem)" : "2px",
                                                background: active ? color : "rgba(255,255,255,0.35)",
                                            }}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Theme toggle */}
                <div className="p-4 flex items-center justify-between">
                    <span className="font-display text-sm text-white/60">Dark Mode</span>
                    <button
                        onClick={toggleTheme}
                        className="relative w-14 h-7 rounded-full transition-all duration-300 active:scale-95"
                        style={{
                            background: theme === "dark" ? "rgba(0,212,255,0.25)" : "rgba(255,107,0,0.25)",
                            border: `1.5px solid ${theme === "dark" ? "#00D4FF" : "#FF6B00"}`,
                        }}
                    >
                        <div
                            className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-sm"
                            style={{
                                left: theme === "dark" ? "calc(100% - 1.6rem)" : "2px",
                                background: theme === "dark" ? "#00D4FF" : "#FF6B00",
                            }}
                        >
                            {theme === "dark" ? "🌙" : "☀️"}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MapsContainer({ onNavigateTo }: { onNavigateTo?: (tab: string) => void }) {
    const {
        myLocation, mapSettings, updateMapSettings,
        riderLocations, activeRide, navState, stopNavigation,
        selectedPOI, setSelectedPOI, user,
        isSearchOpen, setIsSearchOpen,
    } = useAppStore();

    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [weatherData] = useState({ temp: 24, windSpeed: 12, visibility: 8 });
    const [elevation] = useState(1240);
    const [sheetState, setSheetState] = useState<SheetState>("collapsed");
    const [showRouteOptions, setShowRouteOptions] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState("bike");
    const [pendingDest, setPendingDest] = useState<{ name: string; lat: number; lng: number } | null>(null);

    const dragStartY = useRef<number | null>(null);
    const dragStartState = useRef<SheetState>("collapsed");

    const fabBtn = cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all duration-200 select-none"
    );

    const onSheetDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        dragStartY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
        dragStartState.current = sheetState;
    };
    const onSheetDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (dragStartY.current === null) return;
        const endY = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
        const delta = endY - dragStartY.current;
        dragStartY.current = null;
        if (delta > 60) setSheetState(dragStartState.current === "expanded" ? "peek" : "collapsed");
        else if (delta < -60) setSheetState(dragStartState.current === "collapsed" ? "peek" : "expanded");
    };

    // Mock route options based on ETA
    const routeOptions: RouteOption[] = pendingDest
        ? [
            { id: "car", icon: <Car className="w-5 h-5" />, label: "Car", duration: "4 hr 50 min", distance: "237 km", color: "#4285F4" },
            { id: "bike", icon: <Bike className="w-5 h-5" />, label: "Two-wheeler", duration: "4 hr 54 min", distance: "237 km", note: "Fastest route · saves 10% fuel", isFastest: true, savesFuel: true, color: "#00D4FF" },
            { id: "transit", icon: <Train className="w-5 h-5" />, label: "Transit", duration: "5 hr 32 min", distance: "237 km", color: "#FF9F0A" },
            { id: "walk", icon: <Footprints className="w-5 h-5" />, label: "Walk", duration: "2 days", distance: "237 km", color: "#00FF88" },
        ]
        : [];

    // Intercept destination selection from search
    // We expose a function to intercept before actually starting nav
    const handleDestinationSelected = useCallback((dest: { name: string; lat: number; lng: number }) => {
        setPendingDest(dest);
        setShowRouteOptions(true);
        setIsSearchOpen(false);
    }, [setIsSearchOpen]);

    const handleStartNav = () => {
        if (!pendingDest) return;
        useAppStore.getState().startNavigation(pendingDest);
        setShowRouteOptions(false);
        setPendingDest(null);
    };

    return (
        <div className="relative w-full" style={{ height: "100vh" }}>
            {/* Map */}
            <div className="absolute inset-0 z-0">
                <MapView />
            </div>

            {/* === GOOGLE MAPS STYLE SEARCH BAR === */}
            <div
                className="absolute top-0 left-0 right-0 z-20 px-3"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
            >
                {/* Search bar row */}
                <div
                    className="flex items-center gap-3 px-4 h-14 rounded-2xl"
                    style={{
                        background: "rgba(14,14,14,0.97)",
                        backdropFilter: "blur(32px)",
                        WebkitBackdropFilter: "blur(32px)",
                        border: "1.5px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 4px 32px rgba(0,0,0,0.75)",
                    }}
                    onClick={() => setIsSearchOpen(true)}
                >
                    <Search className="w-5 h-5 text-tempest-cyan flex-shrink-0" />
                    <span className="flex-1 font-body text-base text-white/40 select-none">
                        {navState.isNavigating ? navState.destination?.name : "Search here"}
                    </span>
                    <Mic className="w-5 h-5 text-white/35 flex-shrink-0" />
                    {/* Avatar button — opens settings/nav menu */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowAvatarMenu(true); }}
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-sm active:scale-90 transition-all ml-1"
                        style={{
                            background: `${user.avatarColor}20`,
                            border: `2px solid ${user.avatarColor}`,
                            color: user.avatarColor,
                            boxShadow: `0 0 10px ${user.avatarColor}40`,
                            fontSize: 12,
                        }}
                    >
                        {user.avatarInitials}
                    </button>
                </div>

                {/* Category filter chips — Google Maps style */}
                {!navState.isNavigating && !showRouteOptions && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                        {[
                            { label: "Ask Maps", icon: "✨", active: false, color: "#4285F4" },
                            { label: "Restaurants", icon: "🍽️", active: false, color: "#FF9F0A" },
                            { label: "Petrol", icon: "⛽", active: false, color: "#FF6B00" },
                            { label: "Hotels", icon: "🏨", active: false, color: "#00D4FF" },
                            { label: "Mechanics", icon: "🔧", active: false, color: "#BF5AF2" },
                        ].map((chip) => (
                            <button
                                key={chip.label}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-display font-semibold whitespace-nowrap active:scale-95 transition-all"
                                style={{
                                    background: "rgba(12,12,12,0.92)",
                                    backdropFilter: "blur(16px)",
                                    WebkitBackdropFilter: "blur(16px)",
                                    border: "1.5px solid rgba(255,255,255,0.14)",
                                    color: "rgba(255,255,255,0.75)",
                                }}
                            >
                                <span className="text-sm">{chip.icon}</span>
                                <span>{chip.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Search overlay */}
            {isSearchOpen && (
                <div
                    className="absolute inset-0 z-40"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={() => setIsSearchOpen(false)}
                >
                    <div
                        className="mx-3 mt-3 rounded-3xl overflow-hidden animate-slide-up"
                        style={{
                            background: "rgba(10,10,10,0.98)",
                            border: "1.5px solid rgba(255,255,255,0.14)",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.9)",
                            marginTop: "calc(env(safe-area-inset-top) + 0.75rem)",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 h-14 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                            <button onClick={() => setIsSearchOpen(false)}>
                                <ChevronDown className="w-5 h-5 text-white/50 rotate-90" />
                            </button>
                            <input
                                autoFocus
                                placeholder="Search destination, place, POI…"
                                className="flex-1 bg-transparent outline-none font-body text-base text-white"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                                        handleDestinationSelected({ name: (e.target as HTMLInputElement).value, lat: 30.7333, lng: 76.7794 });
                                    }
                                }}
                            />
                            <Mic className="w-5 h-5 text-white/40" />
                        </div>
                        {/* Start location row */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-blue-400 ring-2 ring-white/20" />
                            </div>
                            <span className="font-body text-sm text-tempest-cyan">Your location</span>
                            <button className="ml-auto text-xs font-display text-white/40">Change</button>
                        </div>
                        {/* Recent + Popular */}
                        <div className="py-2">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <span className="text-[10px] font-display uppercase tracking-wider text-white/30">Recent</span>
                            </div>
                            {[
                                { name: "Manali", sub: "Himachal Pradesh", icon: "🏔️", lat: 32.2396, lng: 77.1887 },
                                { name: "Leh", sub: "Ladakh, India", icon: "🏕️", lat: 34.1526, lng: 77.5771 },
                            ].map((s) => (
                                <button key={s.name} onClick={() => handleDestinationSelected(s)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(255,255,255,0.07)" }}>{s.icon}</div>
                                    <div>
                                        <p className="font-body text-sm font-semibold text-white">{s.name}</p>
                                        <p className="text-xs text-white/40">{s.sub}</p>
                                    </div>
                                </button>
                            ))}
                            <div className="px-4 py-2 flex items-center gap-2 mt-1">
                                <TrendingUp className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-[10px] font-display uppercase tracking-wider text-white/30">Popular Routes</span>
                            </div>
                            {[
                                { name: "Chandigarh", sub: "City · 237 km", icon: "🏙️", lat: 30.7333, lng: 76.7794 },
                                { name: "Rohtang Pass", sub: "Mountain Pass · 472 km", icon: "⛰️", lat: 32.3723, lng: 77.2433 },
                                { name: "Spiti Valley", sub: "Region · 510 km", icon: "🌄", lat: 32.2461, lng: 78.0358 },
                            ].map((s) => (
                                <button key={s.name} onClick={() => handleDestinationSelected(s)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-white/5">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                                        style={{ background: "rgba(0,212,255,0.10)", border: "1px solid rgba(0,212,255,0.20)" }}>{s.icon}</div>
                                    <div>
                                        <p className="font-body text-sm text-white/80">{s.name}</p>
                                        <p className="text-xs text-white/35">{s.sub}</p>
                                    </div>
                                    <Navigation className="w-4 h-4 text-tempest-cyan/50 ml-auto" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* === ROUTE OPTIONS (Google Maps style) === */}
            {showRouteOptions && pendingDest && (
                <div className="absolute inset-0 z-35 pointer-events-none">
                    {/* Bottom sheet */}
                    <div
                        className="absolute bottom-0 left-0 right-0 pointer-events-auto animate-slide-up"
                        style={{
                            background: "rgba(10,10,10,0.98)",
                            backdropFilter: "blur(40px)",
                            borderTop: "1.5px solid rgba(255,255,255,0.12)",
                            borderRadius: "24px 24px 0 0",
                            boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
                        }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>
                        {/* Destination header */}
                        <div className="px-4 pb-3 flex items-center gap-3">
                            <div className="flex-1">
                                <p className="font-body text-white/40 text-xs">Destination</p>
                                <p className="font-display font-bold text-white text-lg leading-tight">{pendingDest.name}</p>
                            </div>
                            <button onClick={() => { setShowRouteOptions(false); setPendingDest(null); }}
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.10)" }}>
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>
                        {/* Route mode tabs */}
                        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
                            {routeOptions.map((opt) => {
                                const isSelected = selectedRoute === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelectedRoute(opt.id)}
                                        className="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-2xl transition-all active:scale-95"
                                        style={isSelected
                                            ? { background: opt.color + "20", border: `2px solid ${opt.color}`, color: opt.color }
                                            : { background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)" }
                                        }
                                    >
                                        <span className="mb-1">{opt.icon}</span>
                                        <span className="text-xs font-display font-bold whitespace-nowrap">{opt.duration}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected route detail */}
                        {routeOptions.filter(o => o.id === selectedRoute).map((opt) => (
                            <div key={opt.id} className="mx-4 mb-3 px-4 py-3 rounded-2xl" style={{ background: `${opt.color}10`, border: `1px solid ${opt.color}25` }}>
                                <div className="flex items-center gap-3">
                                    <span style={{ color: opt.color }}>{opt.icon}</span>
                                    <div className="flex-1">
                                        <p className="font-display font-bold text-white text-base">{opt.duration}</p>
                                        <p className="text-white/50 text-xs">{opt.distance}</p>
                                    </div>
                                    {opt.isFastest && (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-display font-bold text-tempest-cyan bg-tempest-cyan/15 px-2 py-0.5 rounded-full">Fastest</span>
                                            {opt.savesFuel && <span className="text-[10px] text-tempest-green flex items-center gap-0.5"><Leaf className="w-2.5 h-2.5" />10% fuel</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Action buttons */}
                        <div className="flex gap-3 px-4 pb-6">
                            <button
                                className="flex-1 h-13 rounded-2xl flex items-center justify-center gap-2 font-display font-bold text-base active:scale-98 transition-all"
                                style={{ background: "#4285F4", color: "#fff", height: 52 }}
                                onClick={handleStartNav}
                            >
                                <Navigation className="w-5 h-5" />
                                Start
                            </button>
                            <button
                                className="h-13 px-5 rounded-2xl flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)", height: 52 }}
                            >
                                Add stops
                            </button>
                            <button
                                className="h-13 px-5 rounded-2xl flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)", height: 52 }}
                            >
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Right FABs */}
            <div className="absolute right-3 z-20 flex flex-col gap-2.5" style={{ bottom: navState.isNavigating ? "14rem" : "5rem" }}>
                <CompassWidget bearing={mapSettings.bearing} onPress={() => updateMapSettings({ bearing: 0 })} />
                <button
                    onClick={() => updateMapSettings({ followMode: !mapSettings.followMode })}
                    className={fabBtn}
                    style={mapSettings.followMode
                        ? { background: "#4285F4", boxShadow: "0 0 20px rgba(66,133,244,0.55)", border: "none" }
                        : fabStyle}
                >
                    <Navigation className="w-5 h-5 text-white" />
                </button>
                <button className={fabBtn} style={fabStyle}
                    onClick={() => updateMapSettings({ zoom: Math.min((mapSettings.zoom ?? 15) + 1, 20) })}>
                    <Plus className="w-5 h-5 text-white" />
                </button>
                <button className={fabBtn} style={fabStyle}
                    onClick={() => updateMapSettings({ zoom: Math.max((mapSettings.zoom ?? 15) - 1, 3) })}>
                    <Minus className="w-5 h-5 text-white" />
                </button>
                <div className="relative">
                    <button onClick={() => setShowLayerMenu((v) => !v)} className={fabBtn} style={fabStyle}>
                        <Layers className="w-5 h-5 text-white" />
                    </button>
                    {showLayerMenu && (
                        <div className="absolute right-16 top-0 p-1.5 w-36 rounded-xl overflow-hidden animate-scale-in z-50" style={fabStyle}>
                            {LAYER_OPTIONS.map(({ id, emoji, label }) => {
                                const active = mapSettings.style === id;
                                return (
                                    <button key={id} onClick={() => { updateMapSettings({ style: id }); setShowLayerMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-display transition-all active:scale-95"
                                        style={{ background: active ? "rgba(66,133,244,0.2)" : "transparent", color: active ? "#4285F4" : "rgba(255,255,255,0.7)" }}>
                                        <span>{emoji}</span><span>{label}</span>
                                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4285F4]" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <SOSButton compact className="w-14 h-14" />
            </div>

            {/* Speed widget left */}
            <div className="absolute left-3 z-20" style={{ bottom: navState.isNavigating ? "14.5rem" : "5.5rem" }}>
                <SpeedWidget speed={myLocation?.speed ?? 0} />
            </div>

            {/* Active navigation bottom sheet */}
            {navState.isNavigating && navState.destination && (
                <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
                    <div className="rounded-t-3xl overflow-hidden" style={{
                        background: "rgba(10,10,10,0.97)",
                        backdropFilter: "blur(40px)",
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        borderBottom: "none",
                        boxShadow: "0 -4px 40px rgba(0,0,0,0.8)",
                    }}>
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 cursor-grab"
                            onMouseDown={onSheetDragStart} onMouseUp={onSheetDragEnd}
                            onTouchStart={onSheetDragStart} onTouchEnd={onSheetDragEnd}
                            onClick={() => setSheetState(s => s === "expanded" ? "peek" : "expanded")}>
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>
                        {/* ETA row */}
                        <div className="px-4 pb-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(66,133,244,0.15)", border: "1.5px solid rgba(66,133,244,0.30)" }}>
                                <Navigation className="w-5 h-5 text-[#4285F4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-white text-base leading-tight truncate">{navState.destination.name}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[#4285F4] font-display font-bold text-sm">{formatDuration(navState.etaMinutes)}</span>
                                    <span className="text-white/40 text-xs">·</span>
                                    <span className="text-white/50 text-xs">{formatDist(navState.distanceRemaining / 1000)}</span>
                                </div>
                            </div>
                            <button onClick={stopNavigation}
                                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
                                style={{ background: "rgba(255,45,85,0.15)", border: "1px solid rgba(255,45,85,0.30)" }}>
                                <X className="w-5 h-5 text-tempest-red" />
                            </button>
                        </div>
                        {/* Maneuver + stats row */}
                        <div className="px-4 pb-3 flex items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
                            <div className="flex items-center gap-1.5">
                                <Route className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-white/60 text-xs font-display">{formatDist(navState.distanceRemaining / 1000)} remaining</span>
                            </div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-white/60 text-xs font-display">
                                    ETA {new Date(Date.now() + navState.etaMinutes * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <div className="flex-1" />
                            <button onClick={() => setSheetState(s => s === "expanded" ? "peek" : "expanded")}
                                className="flex items-center gap-1 text-[#4285F4] text-xs font-display active:opacity-70">
                                Steps {sheetState === "expanded" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        {/* Next maneuver */}
                        {navState.nextManeuver && (
                            <div className="mx-3 mb-3 px-3 py-2 rounded-xl flex items-center gap-3"
                                style={{ background: "rgba(66,133,244,0.10)", border: "1px solid rgba(66,133,244,0.20)" }}>
                                <span className="text-xl">↑</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-display font-semibold text-sm truncate">{navState.nextManeuver}</p>
                                    {navState.nextManeuverDistance > 0 && (
                                        <p className="text-[#4285F4] text-xs mt-0.5">
                                            in {navState.nextManeuverDistance < 1000 ? `${Math.round(navState.nextManeuverDistance)}m` : `${(navState.nextManeuverDistance / 1000).toFixed(1)}km`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Expandable steps */}
                        <div style={{ height: sheetState === "expanded" ? "30vh" : 0, overflow: "hidden", transition: "height 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
                            <div className="overflow-y-auto px-3 pb-4" style={{ height: "30vh" }}>
                                <p className="text-[10px] font-display uppercase tracking-wider text-white/30 mb-2 pt-1">Turn-by-turn</p>
                                {[
                                    { icon: "↑", text: "Head north on NH44", dist: "2.1 km" },
                                    { icon: "↰", text: "Turn left onto Ring Road", dist: "800 m" },
                                    { icon: "↱", text: "Turn right onto GT Karnal Road", dist: "4.5 km" },
                                    { icon: "↑", text: "Continue on NH44", dist: "15 km" },
                                    { icon: "📍", text: `Arrive at ${navState.destination?.name}`, dist: "" },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl"
                                        style={{ background: i === 0 ? "rgba(66,133,244,0.12)" : "transparent" }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                                            style={{ background: "rgba(255,255,255,0.07)" }}>{step.icon}</div>
                                        <p className="text-white/80 text-sm font-body flex-1 truncate">{step.text}</p>
                                        {step.dist && <span className="text-white/35 text-xs font-mono flex-shrink-0">{step.dist}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Weather bar — only when not navigating */}
            {!navState.isNavigating && !showRouteOptions && (
                <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3">
                    <div className="px-4 py-3.5 rounded-3xl" style={{
                        background: "rgba(10,10,10,0.95)",
                        backdropFilter: "blur(40px)",
                        WebkitBackdropFilter: "blur(40px)",
                        border: "1.5px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 -4px 40px rgba(0,0,0,0.7)",
                    }}>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[9px] font-display uppercase tracking-wider text-white/40">ALT</span>
                                <span className="font-display font-bold text-sm text-white">{elevation}m</span>
                            </div>
                            <div className="w-px h-7 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                                <Thermometer className="w-4 h-4 text-tempest-orange flex-shrink-0" />
                                <span className="font-display font-bold text-sm text-white">{weatherData.temp}°C</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Wind className="w-4 h-4 text-tempest-cyan flex-shrink-0" />
                                <span className="font-display font-bold text-sm text-white">{weatherData.windSpeed}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <span className="font-display text-sm text-white/60">{weatherData.visibility}km</span>
                            </div>
                            <div className="flex-1" />
                            <button
                                className="flex items-center gap-2 px-4 h-9 rounded-xl font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{ background: "rgba(66,133,244,0.18)", border: "1px solid rgba(66,133,244,0.35)", color: "#4285F4" }}
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Navigation className="w-4 h-4" />
                                Navigate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POI popup */}
            {selectedPOI && (
                <div className="absolute bottom-0 left-0 right-0 z-40 px-3 pb-4 animate-slide-up">
                    <div className="rounded-3xl p-4" style={{
                        background: "rgba(10,10,10,0.97)",
                        backdropFilter: "blur(40px)",
                        border: "1.5px solid rgba(255,255,255,0.14)",
                        boxShadow: "0 -8px 40px rgba(0,0,0,0.8)",
                    }}>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>📍</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-white text-base truncate">{selectedPOI.name}</p>
                                <p className="text-white/40 text-sm mt-0.5 capitalize">{selectedPOI.type}</p>
                            </div>
                            <button onClick={() => setSelectedPOI(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => {
                                    handleDestinationSelected({ lat: selectedPOI.lat, lng: selectedPOI.lng, name: selectedPOI.name });
                                    setSelectedPOI(null);
                                }}
                                className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-95 transition-all"
                                style={{ background: "#4285F4", color: "#fff" }}>
                                <Navigation className="w-4 h-4" />
                                Directions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar menu */}
            {showAvatarMenu && (
                <AvatarMenuPanel
                    user={user}
                    onClose={() => setShowAvatarMenu(false)}
                    onNavigateTo={(tab) => {
                        onNavigateTo?.(tab);
                    }}
                />
            )}
        </div>
    );
}