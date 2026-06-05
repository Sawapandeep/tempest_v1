// features/search/components/SearchResults.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    Clock,
    Navigation,
    Building2,
    Globe,
    Hash,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/features/search/hooks/useSearch";
import { useMapStore } from "@/store/mapStore";
import { MAP_CONFIG } from "@/lib/map-config";
import type { GeocodingResult } from "@/types/map";

// ------------------------------------------------------------------
// Highlight matching text — escapes regex special chars
// ------------------------------------------------------------------
function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let regex: RegExp;
    try {
        regex = new RegExp(`(${escaped})`, "gi");
    } catch {
        return <>{text}</>;
    }

    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark
                        key={i}
                        className="bg-tempest-500/20 text-tempest-300 rounded-sm not-italic px-0.5"
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

// ------------------------------------------------------------------
// Icon resolution by OSM category
// ------------------------------------------------------------------
function getCategoryIcon(category?: string): React.ElementType {
    if (!category) return MapPin;
    const c = category.toLowerCase();
    if (c.includes("coordinate")) return Hash;
    if (
        c.includes("building") ||
        c.includes("amenity") ||
        c.includes("shop") ||
        c.includes("office")
    )
        return Building2;
    if (
        c.includes("highway") ||
        c.includes("road") ||
        c.includes("street") ||
        c.includes("route")
    )
        return Navigation;
    if (
        c.includes("place") ||
        c.includes("boundary") ||
        c.includes("admin") ||
        c.includes("country") ||
        c.includes("state") ||
        c.includes("city")
    )
        return Globe;
    return MapPin;
}

// ------------------------------------------------------------------
// Single result row
// ------------------------------------------------------------------
interface ResultRowProps {
    result: GeocodingResult;
    query: string;
    index: number;
    isActive: boolean;
    isRecent: boolean;
    onClick: () => void;
    onHover: () => void;
}

function ResultRow({
    result,
    query,
    index,
    isActive,
    isRecent,
    onClick,
    onHover,
}: ResultRowProps) {
    const Icon = isRecent ? Clock : getCategoryIcon(result.category);

    return (
        <motion.button
            id={`search-result-${index}`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.15 }}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            onMouseEnter={onHover}
            role="option"
            aria-selected={isActive}
            aria-label={`${result.name}${result.address ? `, ${result.address}` : ""}`}
            className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left",
                "transition-colors duration-100",
                isActive
                    ? "bg-tempest-500/10 text-foreground"
                    : "hover:bg-surface-subtle",
                "focus-visible:outline-none"
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    isRecent
                        ? "bg-surface-subtle border border-border/50"
                        : isActive
                            ? "bg-tempest-500/20 border border-tempest-500/30"
                            : "bg-tempest-500/10 border border-tempest-500/20"
                )}
            >
                <Icon
                    className={cn(
                        "w-3.5 h-3.5",
                        isRecent ? "text-muted-foreground" : "text-tempest-400"
                    )}
                />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug truncate">
                    <HighlightMatch text={result.name} query={isRecent ? "" : query} />
                </p>
                {result.address && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug">
                        {result.address}
                    </p>
                )}
                {result.category && !isRecent && (
                    <span className="inline-block mt-1 text-[10px] text-tempest-400/80 bg-tempest-500/10 rounded-md px-1.5 py-0.5 leading-none">
                        {result.category}
                    </span>
                )}
            </div>

            <Navigation className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-1.5" />
        </motion.button>
    );
}

// ------------------------------------------------------------------
// Skeleton loader
// ------------------------------------------------------------------
function SkeletonRows() {
    return (
        <div className="px-3 py-2 flex flex-col gap-2">
            {[70, 55, 80].map((w, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-xl skeleton shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded skeleton" style={{ width: `${w}%` }} />
                        <div className="h-2.5 rounded skeleton w-3/5" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
interface SearchResultsProps {
    activeIndex?: number;
    onIndexChange?: (i: number) => void;
}

export function SearchResults({
    activeIndex = -1,
    onIndexChange,
}: SearchResultsProps) {
    const { query, results, isSearching, recentSearches, handleSelectResult } =
        useSearch();
    const { flyTo, setSelectedPlace } = useMapStore();

    const handleSelect = (result: GeocodingResult) => {
        handleSelectResult(result);
        setSelectedPlace(result);

        // If result has a bounding box, fit to it; otherwise fly to center
        if (result.bbox) {
            const { north, south, east, west } = result.bbox;
            const centerLng = (west + east) / 2;
            const centerLat = (south + north) / 2;
            // Rough zoom: tighter bbox → higher zoom
            const latSpan = north - south;
            const zoom = latSpan < 0.01 ? 16 : latSpan < 0.1 ? 14 : latSpan < 1 ? 12 : latSpan < 5 ? 9 : 6;
            flyTo({ lng: centerLng, lat: centerLat }, zoom);
        } else {
            flyTo(
                { lng: result.coordinates.lng, lat: result.coordinates.lat },
                MAP_CONFIG.DEFAULT_ZOOM
            );
        }
    };

    const showRecents = !query.trim() && recentSearches.length > 0;
    const showResults = query.trim().length > 0 && results.length > 0;
    const isEmpty =
        query.trim().length > 0 && !isSearching && results.length === 0;

    return (
        <div className="py-1" role="listbox" aria-label="Search results">
            {/* Loading */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <SkeletonRows />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {isEmpty && !isSearching && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2 py-8 px-4 text-center"
                >
                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Try a city name, address, or coordinates like{" "}
                        <code className="font-mono bg-muted px-1 rounded">28.61, 77.20</code>
                    </p>
                </motion.div>
            )}

            {/* Recent searches */}
            {showRecents && !isSearching && (
                <div>
                    <div className="flex items-center justify-between px-3 pt-2 pb-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            Recent
                        </p>
                    </div>
                    {recentSearches.slice(0, 5).map((result, i) => (
                        <ResultRow
                            key={result.id}
                            result={result}
                            query=""
                            index={i}
                            isActive={activeIndex === i}
                            isRecent
                            onClick={() => handleSelect(result)}
                            onHover={() => onIndexChange?.(i)}
                        />
                    ))}
                </div>
            )}

            {/* Live results */}
            {showResults && !isSearching && (
                <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Results
                    </p>
                    {results.map((result, i) => (
                        <ResultRow
                            key={result.id}
                            result={result}
                            query={query}
                            index={i}
                            isActive={activeIndex === i}
                            isRecent={false}
                            onClick={() => handleSelect(result)}
                            onHover={() => onIndexChange?.(i)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}