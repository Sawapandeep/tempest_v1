"use client";
// src/features/search/components/SearchResults.tsx

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Navigation, Building2, Globe, Hash, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/features/search/hooks/useSearch";
import { useMapStore } from "@/store/mapStore";
import { MAP_CONFIG } from "@/lib/map-config";
import type { GeocodingResult } from "@/types/map";

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} className="bg-tempest-500/20 text-tempest-300 rounded px-0.5 not-italic">
                {part}
            </mark>
        ) : (
            part
        )
    );
}

function getCategoryIcon(category?: string): React.ElementType {
    if (!category) return MapPin;
    const c = category.toLowerCase();
    if (c.includes("coordinates")) return Hash;
    if (c.includes("building") || c.includes("amenity") || c.includes("shop")) return Building2;
    if (c.includes("highway") || c.includes("road") || c.includes("street")) return Navigation;
    if (c.includes("place") || c.includes("boundary")) return Globe;
    return MapPin;
}

interface SearchResultItemProps {
    result: GeocodingResult;
    query: string;
    index: number;
    onClick: () => void;
    isRecent?: boolean;
}

function SearchResultItem({
    result, query, index, onClick, isRecent = false
}: SearchResultItemProps) {
    const Icon = isRecent ? Clock : getCategoryIcon(result.category);

    return (
        <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035, duration: 0.18 }}
            onClick={onClick}
            className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left",
                "hover:bg-surface-subtle transition-all duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            )}
            role="option"
            aria-label={`${result.name}, ${result.address}`}
        >
            {/* Icon */}
            <div
                className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    isRecent
                        ? "bg-surface-subtle border border-border/50"
                        : "bg-tempest-500/10 border border-tempest-500/20"
                )}
            >
                <Icon
                    className={cn(
                        "w-4 h-4",
                        isRecent ? "text-muted-foreground" : "text-tempest-400"
                    )}
                />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-snug">
                    {highlightMatch(result.name, query)}
                </p>
                {result.address && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug">
                        {result.address}
                    </p>
                )}
                {result.category && (
                    <span className="inline-block mt-1 text-[10px] text-tempest-400/70 bg-tempest-500/8 rounded-md px-1.5 py-0.5 leading-none">
                        {result.category}
                    </span>
                )}
            </div>

            {/* Navigate arrow */}
            <Navigation className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1" />
        </motion.button>
    );
}

export function SearchResults() {
    const {
        query, results, isSearching, isOpen,
        recentSearches, handleSelectResult,
    } = useSearch();

    const { flyTo, setSelectedPlace } = useMapStore();

    const handleSelect = (result: GeocodingResult) => {
        handleSelectResult(result);
        setSelectedPlace(result);
        flyTo(
            { lng: result.coordinates.lng, lat: result.coordinates.lat },
            MAP_CONFIG.DEFAULT_ZOOM
        );
    };

    const showRecents = !query && recentSearches.length > 0;
    const showResults = query.length > 0;
    const hasResults = results.length > 0;
    const isEmpty = showResults && !isSearching && !hasResults;

    return (
        <div
            className="py-1"
            role="listbox"
            aria-label="Search results"
        >
            {/* Loading skeleton */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-3 py-2 flex flex-col gap-2"
                    >
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 py-1">
                                <div className="w-8 h-8 rounded-xl skeleton shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 rounded skeleton" style={{ width: `${60 + i * 10}%` }} />
                                    <div className="h-2.5 rounded skeleton w-4/5" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {isEmpty && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2 py-8 px-4 text-center"
                >
                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground">
                        Try searching for a city, address, or landmark
                    </p>
                </motion.div>
            )}

            {/* Recent searches */}
            {showRecents && !isSearching && (
                <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Recent
                    </p>
                    {recentSearches.slice(0, 5).map((result, i) => (
                        <SearchResultItem
                            key={result.id}
                            result={result}
                            query=""
                            index={i}
                            onClick={() => handleSelect(result)}
                            isRecent
                        />
                    ))}
                </div>
            )}

            {/* Search results */}
            {showResults && !isSearching && hasResults && (
                <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Results
                    </p>
                    {results.map((result, i) => (
                        <SearchResultItem
                            key={result.id}
                            result={result}
                            query={query}
                            index={i}
                            onClick={() => handleSelect(result)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}