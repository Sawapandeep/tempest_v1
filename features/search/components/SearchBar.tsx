"use client";
// features/search/components/SearchBar.tsx

import { useRef, useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, ArrowLeft, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/features/search/hooks/useSearch";
import { SearchDropdown } from "@/features/search/components/SearchDropdown";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface SearchBarProps {
    compact?: boolean;
    onResultSelect?: () => void;
}

// Detect if input looks like coordinates
function looksLikeCoordinates(q: string): boolean {
    return /^-?\d{1,3}(\.\d+)?[\s,]+/.test(q.trim());
}

export function SearchBar({ compact = false, onResultSelect }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();

    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const {
        query,
        results,
        isSearching,
        isOpen,
        handleQueryChange,
        handleSelectResult,
        handleClear,
        handleFocus,
        handleBlur,
        setSelectedPlace,
        flyTo,
    } = useSearch();

    const showClear = query.length > 0;
    const showBack = isFocused && compact;
    const isCoordInput = looksLikeCoordinates(query);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!isOpen) return;
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, results.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, -1));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (activeIndex >= 0 && results[activeIndex]) {
                        const r = results[activeIndex];
                        handleSelectResult(r);
                        setSelectedPlace(r);
                        flyTo({ lng: r.coordinates.lng, lat: r.coordinates.lat }, 14);
                        setActiveIndex(-1);
                        inputRef.current?.blur();
                        onResultSelect?.();
                    }
                    break;
                case "Escape":
                    handleClear();
                    inputRef.current?.blur();
                    setActiveIndex(-1);
                    break;
            }
        },
        [isOpen, results, activeIndex, handleSelectResult, handleClear, setSelectedPlace, flyTo, onResultSelect]
    );

    const handleInputFocus = () => {
        setIsFocused(true);
        setActiveIndex(-1);
        handleFocus();
    };

    const handleInputBlur = () => {
        setIsFocused(false);
        handleBlur();
        setTimeout(() => setActiveIndex(-1), 200);
    };

    const placeholder = compact
        ? "Search places, coordinates…"
        : "Search places, addresses, coordinates (e.g. 28.61, 77.20)…";

    return (
        <div ref={containerRef} className={cn("relative w-full", compact ? "h-12" : "")}>
            {/* Input wrapper */}
            <div
                className={cn(
                    "relative flex items-center gap-2 rounded-2xl transition-all duration-200 glass",
                    isFocused
                        ? "ring-2 ring-tempest-500/50 shadow-[0_0_0_4px_rgba(42,159,240,0.08)]"
                        : "",
                    compact ? "h-12 px-3" : "h-11 px-3"
                )}
            >
                {/* Leading icon */}
                <AnimatePresence mode="wait">
                    {showBack ? (
                        <motion.button
                            key="back"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.12 }}
                            onClick={() => { handleClear(); inputRef.current?.blur(); }}
                            className="text-muted-foreground hover:text-foreground shrink-0 touch-manipulation"
                            aria-label="Close search"
                            type="button"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="search-icon"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.12 }}
                            className="shrink-0 pointer-events-none"
                        >
                            {isSearching ? (
                                <Loader2 className="w-4 h-4 text-tempest-400 animate-spin" />
                            ) : isCoordInput && isFocused ? (
                                <Hash className="w-4 h-4 text-tempest-400" />
                            ) : (
                                <Search
                                    className={cn(
                                        "w-4 h-4 transition-colors",
                                        isFocused ? "text-tempest-400" : "text-muted-foreground"
                                    )}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Text input */}
                <input
                    ref={inputRef}
                    id="map-search-input"
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={query}
                    onChange={(e) => { handleQueryChange(e.target.value); setActiveIndex(-1); }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm min-w-0"
                    aria-label="Search places, addresses, or coordinates"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen && results.length > 0}
                    aria-controls={listboxId}
                    aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
                    role="combobox"
                />

                {/* Coordinate hint badge */}
                <AnimatePresence>
                    {isCoordInput && isFocused && !isSearching && (
                        <motion.span
                            key="coord-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                            className="shrink-0 text-[10px] font-medium text-tempest-400 bg-tempest-500/10 rounded-md px-1.5 py-0.5 leading-none"
                        >
                            coords
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Clear button */}
                <AnimatePresence>
                    {showClear && (
                        <motion.button
                            key="clear"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.12 }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleClear();
                                inputRef.current?.focus();
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0 touch-manipulation"
                            aria-label="Clear search"
                            type="button"
                        >
                            <X className="w-3.5 h-3.5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop dropdown */}
            {!isMobile && (
                <div id={listboxId}>
                    <SearchDropdown
                        anchorRef={containerRef}
                        activeIndex={activeIndex}
                        onIndexChange={setActiveIndex}
                    />
                </div>
            )}
        </div>
    );
}