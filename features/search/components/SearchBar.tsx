"use client";
// src/features/search/components/SearchBar.tsx

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, ArrowLeft, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/features/search/hooks/useSearch";
import { useMapStore } from "@/store/mapStore";

interface SearchBarProps {
    compact?: boolean;
    onResultSelect?: () => void;
}

export function SearchBar({ compact = false, onResultSelect }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const {
        query,
        isSearching,
        isOpen,
        handleQueryChange,
        handleSelectResult,
        handleClear,
        handleFocus,
        handleBlur,
    } = useSearch();

    const { flyTo } = useMapStore();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            handleClear();
            inputRef.current?.blur();
        }
    };

    const hasQuery = query.length > 0;
    const showClear = hasQuery;
    const showBack = isFocused && compact;

    return (
        <div className={cn("relative w-full", compact ? "h-12" : "")}>
            <div
                className={cn(
                    "relative flex items-center gap-2 rounded-2xl transition-all duration-200",
                    "glass",
                    isFocused
                        ? "ring-2 ring-tempest-500/50 shadow-tempest-glow"
                        : "shadow-tempest-sm",
                    compact ? "h-12 px-3" : "h-11 px-3"
                )}
            >
                {/* Back / Search icon */}
                <AnimatePresence mode="wait">
                    {showBack ? (
                        <motion.button
                            key="back"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => {
                                handleClear();
                                inputRef.current?.blur();
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:outline-none"
                            aria-label="Close search"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                            className="shrink-0"
                        >
                            {isSearching ? (
                                <Loader2 className="w-4 h-4 text-tempest-400 animate-spin" />
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

                {/* Input */}
                <input
                    ref={inputRef}
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => {
                        setIsFocused(true);
                        handleFocus();
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        handleBlur();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search places, addresses, coordinates…"
                    className={cn(
                        "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none text-sm",
                        "min-w-0"
                    )}
                    aria-label="Search"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    role="combobox"
                />

                {/* Right actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Clear button */}
                    <AnimatePresence>
                        {showClear && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => {
                                    handleClear();
                                    inputRef.current?.focus();
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                                aria-label="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}