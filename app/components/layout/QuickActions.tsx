"use client";
// src/components/layout/QuickActions.tsx

import { motion } from "framer-motion";
import {
    Navigation, Coffee, UtensilsCrossed,
    Hotel, ShoppingBag, Fuel, Hospital,
    MapPin, Clock, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/searchStore";

const QUICK_SEARCHES = [
    { label: "Restaurants", icon: UtensilsCrossed, query: "restaurants nearby", color: "text-orange-400" },
    { label: "Coffee", icon: Coffee, query: "coffee shops nearby", color: "text-amber-400" },
    { label: "Hotels", icon: Hotel, query: "hotels nearby", color: "text-blue-400" },
    { label: "Shopping", icon: ShoppingBag, query: "shopping nearby", color: "text-purple-400" },
    { label: "Fuel", icon: Fuel, query: "gas stations nearby", color: "text-green-400" },
    { label: "Hospital", icon: Hospital, query: "hospitals nearby", color: "text-red-400" },
];

const RECENT_ITEMS = [
    { label: "Times Square", address: "Manhattan, New York", icon: Clock },
    { label: "Eiffel Tower", address: "Paris, France", icon: Clock },
    { label: "Tokyo Station", address: "Chiyoda, Tokyo", icon: Clock },
];

export function QuickActions() {
    const { setQuery, setIsOpen } = useSearchStore();

    const handleQuickSearch = (query: string) => {
        setQuery(query);
        setIsOpen(true);
    };

    return (
        <div className="px-3 py-2 flex flex-col gap-5">
            {/* Quick category search */}
            <section>
                <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                    Explore Nearby
                </h2>
                <div className="grid grid-cols-3 gap-1.5">
                    {QUICK_SEARCHES.map((item, i) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.2 }}
                            onClick={() => handleQuickSearch(item.query)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-2xl",
                                "bg-surface-subtle hover:bg-surface-elevated border border-border/50",
                                "transition-all duration-150 hover:border-border",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            aria-label={`Search for ${item.label}`}
                        >
                            <item.icon className={cn("w-5 h-5", item.color)} />
                            <span className="text-[11px] font-medium text-foreground leading-none">
                                {item.label}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* Recent searches placeholder */}
            <section>
                <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Recent
                    </h2>
                    <button className="text-[10px] text-tempest-400 hover:text-tempest-300 transition-colors">
                        Clear
                    </button>
                </div>
                <div className="flex flex-col gap-0.5">
                    {RECENT_ITEMS.map((item, i) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.24 + i * 0.05, duration: 0.2 }}
                            onClick={() => handleQuickSearch(item.label)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left",
                                "hover:bg-surface-subtle transition-all duration-150",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                        >
                            <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-border/50 flex items-center justify-center shrink-0">
                                <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.address}</p>
                            </div>
                            <Navigation className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* Trending */}
            <section>
                <div className="flex items-center gap-2 mb-2 px-1">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Trending
                    </h2>
                </div>
                <div className="space-y-0.5">
                    {["Central Park, NYC", "Colosseum, Rome", "Shibuya Crossing"].map((place, i) => (
                        <motion.button
                            key={place}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            onClick={() => handleQuickSearch(place)}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-sm text-muted-foreground",
                                "hover:bg-surface-subtle hover:text-foreground transition-all duration-150",
                                "flex items-center gap-2"
                            )}
                        >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{place}</span>
                        </motion.button>
                    ))}
                </div>
            </section>
        </div>
    );
}