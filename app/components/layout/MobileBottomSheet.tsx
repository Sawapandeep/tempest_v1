"use client";
// src/components/layout/MobileBottomSheet.tsx

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
    Coffee, UtensilsCrossed, Hotel, ShoppingBag,
    Fuel, Hospital, MapPin, Navigation,
    Search, Layers, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/searchStore";
import { SearchResults } from "@/features/search/components/SearchResults";

type SheetSnap = "peek" | "half" | "full";

const SNAP_HEIGHTS: Record<SheetSnap, number> = {
    peek: 88,
    half: 340,
    full: 560,
};

const QUICK_CATEGORIES = [
    { label: "Food", icon: UtensilsCrossed, color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Coffee", icon: Coffee, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Hotels", icon: Hotel, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Shopping", icon: ShoppingBag, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Fuel", icon: Fuel, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Hospital", icon: Hospital, color: "text-red-400", bg: "bg-red-400/10" },
];

export function MobileBottomSheet() {
    const [snap, setSnap] = useState<SheetSnap>("peek");
    const { isOpen: searchOpen, results, query, setQuery, setIsOpen } = useSearchStore();

    const showResults = searchOpen && (results.length > 0 || query.length > 0);
    const currentHeight = SNAP_HEIGHTS[snap];

    const cycleSnap = () => {
        setSnap((s) => {
            if (s === "peek") return "half";
            if (s === "half") return "full";
            return "peek";
        });
    };

    const handleQuickSearch = (q: string) => {
        setQuery(q);
        setIsOpen(true);
        setSnap("half");
    };

    return (
        <motion.div
            className="glass rounded-t-3xl overflow-hidden"
            animate={{ height: currentHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }}
            style={{ touchAction: "none" }}
        >
            {/* Drag handle */}
            <button
                className="w-full pt-3 pb-2 flex flex-col items-center gap-0 focus-visible:outline-none"
                onClick={cycleSnap}
                aria-label={`Expand sheet (currently ${snap})`}
            >
                <div className="bottom-sheet-handle" />
            </button>

            {/* Content based on snap */}
            <div className="px-4 overflow-hidden" style={{ height: currentHeight - 32 }}>
                {snap === "peek" ? (
                    <PeekContent />
                ) : showResults ? (
                    <div className="h-full overflow-y-auto no-scrollbar">
                        <SearchResults />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto no-scrollbar">
                        <QuickCategoryGrid onSearch={handleQuickSearch} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function PeekContent() {
    return (
        <div className="flex items-center gap-3 h-12">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-subtle border border-border/50">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">Search places, addresses…</span>
            </div>
            <button
                className="w-10 h-10 rounded-xl bg-surface-subtle border border-border/50 flex items-center justify-center"
                aria-label="Map layers"
            >
                <Layers className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    );
}

function QuickCategoryGrid({ onSearch }: { onSearch: (q: string) => void }) {
    return (
        <div className="flex flex-col gap-4">
            {/* Category pills */}
            <div className="grid grid-cols-3 gap-2">
                {QUICK_CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat.label}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => onSearch(`${cat.label} nearby`)}
                        className={cn(
                            "flex flex-col items-center gap-1.5 py-3 rounded-2xl",
                            "border border-border/50 transition-all duration-150",
                            "hover:border-border active:scale-95",
                            cat.bg
                        )}
                    >
                        <cat.icon className={cn("w-5 h-5", cat.color)} />
                        <span className="text-xs font-medium text-foreground">{cat.label}</span>
                    </motion.button>
                ))}
            </div>

            {/* Recent / suggestions */}
            <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Recent Places
                </p>
                <div className="space-y-0.5">
                    {["Times Square", "Central Park", "Grand Central Terminal"].map((place) => (
                        <button
                            key={place}
                            onClick={() => onSearch(place)}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-subtle transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-border/50 flex items-center justify-center shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{place}</p>
                                <p className="text-xs text-muted-foreground">New York, USA</p>
                            </div>
                            <Navigation className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}