"use client";
// app/components/layout/Sidebar.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Bookmark, Settings,
    ChevronLeft, ChevronRight, Star, Navigation2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchResults } from "@/features/search/components/SearchResults";
import { useSearchStore } from "@/store/searchStore";
import { SidebarBrand } from "@/app/components/layout/SidebarBrand";
import { QuickActions } from "@/app/components/layout/QuickActions";

type SidebarTab = "search" | "saved" | "settings";

interface SidebarProps {
    onOpenRouting?: () => void;
}

export function Sidebar({ onOpenRouting }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>("search");
    const { isOpen: searchOpen, results, query, isSearching } = useSearchStore();

    const showResults =
        searchOpen && (results.length > 0 || query.length > 0 || isSearching);

    return (
        <div className="h-full flex pointer-events-auto select-none">
            {/* Main panel */}
            <AnimatePresence initial={false} mode="wait">
                {!collapsed && (
                    <motion.div
                        key="sidebar-panel"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 360, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                        className="h-full overflow-hidden"
                    >
                        <div className="w-[360px] h-full flex flex-col glass border-r border-border/50">
                            <SidebarBrand />

                            {/* Tab row */}
                            <div className="flex items-center gap-1 px-3 pb-3 border-b border-border/40">
                                {(
                                    [
                                        { id: "search", icon: Search, label: "Search" },
                                        { id: "saved", icon: Bookmark, label: "Saved" },
                                        { id: "settings", icon: Settings, label: "Settings" },
                                    ] as { id: SidebarTab; icon: React.ElementType; label: string }[]
                                ).map(({ id, icon: Icon, label }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium",
                                            "transition-all duration-150",
                                            activeTab === id
                                                ? "bg-tempest-500/15 text-tempest-400"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        )}
                                        aria-pressed={activeTab === id}
                                        aria-label={label}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                    </button>
                                ))}

                                {/* Directions shortcut */}
                                {onOpenRouting && (
                                    <motion.button
                                        whileTap={{ scale: 0.93 }}
                                        onClick={onOpenRouting}
                                        className={cn(
                                            "ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium",
                                            "bg-tempest-500/15 text-tempest-400 hover:bg-tempest-500/25 transition-all"
                                        )}
                                        aria-label="Get directions"
                                    >
                                        <Navigation2 className="w-3.5 h-3.5" />
                                        Directions
                                    </motion.button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden flex flex-col">
                                {activeTab === "search" && (
                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        <div className="px-3 pt-3 pb-2">
                                            <SearchBar />
                                        </div>
                                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                                            {showResults ? <SearchResults /> : <QuickActions />}
                                        </div>
                                    </div>
                                )}
                                {activeTab === "saved" && <SavedPlaceholderTab />}
                                {activeTab === "settings" && <SettingsPlaceholderTab />}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapse toggle */}
            <div className="flex items-center">
                <motion.button
                    onClick={() => setCollapsed((c) => !c)}
                    whileTap={{ scale: 0.9 }}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="glass w-5 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    style={{ borderRadius: "0 12px 12px 0", borderLeft: "none" }}
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3" />
                    ) : (
                        <ChevronLeft className="w-3 h-3" />
                    )}
                </motion.button>
            </div>
        </div>
    );
}

function SavedPlaceholderTab() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-tempest-500/10 border border-tempest-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-tempest-400" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">Saved Places</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Sign in to save your favorite places
                </p>
            </div>
            <button className="mt-2 px-4 py-2 rounded-xl bg-tempest-500 text-white text-xs font-medium hover:bg-tempest-600 transition-colors">
                Sign In
            </button>
        </div>
    );
}

function SettingsPlaceholderTab() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">Settings</p>
                <p className="text-xs text-muted-foreground mt-1">Available in Phase 11</p>
            </div>
        </div>
    );
}