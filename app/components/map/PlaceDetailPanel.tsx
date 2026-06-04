"use client";
// src/components/map/PlaceDetailPanel.tsx

import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Navigation, Copy, ExternalLink, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/store/mapStore";
import { formatCoordinates } from "@/lib/utils";

export function PlaceDetailPanel() {
    const { selectedPlace, setSelectedPlace } = useMapStore();

    if (!selectedPlace) return null;

    const coords = selectedPlace.coordinates;
    const formattedCoords = formatCoordinates(coords.lat, coords.lng);

    const copyCoords = async () => {
        await navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    };

    const openDirections = () => {
        const url = `https://www.openstreetmap.org/directions?from=&to=${coords.lat},${coords.lng}`;
        window.open(url, "_blank");
    };

    return (
        <AnimatePresence>
            <motion.div
                key="place-panel"
                initial={{ y: 16, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 16, opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                    "glass rounded-2xl overflow-hidden",
                    "max-w-sm w-full"
                )}
            >
                {/* Header */}
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-tempest-500/15 border border-tempest-500/25 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-tempest-400" />
                        </div>

                        {/* Name + category */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-semibold text-foreground leading-snug truncate">
                                {selectedPlace.name}
                            </h2>
                            {selectedPlace.category && (
                                <p className="text-xs text-tempest-400/80 mt-0.5">{selectedPlace.category}</p>
                            )}
                        </div>

                        {/* Close */}
                        <button
                            onClick={() => setSelectedPlace(null)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:outline-none"
                            aria-label="Close place details"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border/50 mx-4" />

                {/* Details */}
                <div className="px-4 py-3 space-y-2">
                    {/* Address */}
                    {selectedPlace.address && (
                        <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                                {selectedPlace.address}
                            </p>
                        </div>
                    )}

                    {/* Coordinates */}
                    <button
                        onClick={copyCoords}
                        className="flex items-center gap-2 group w-full text-left"
                        aria-label="Copy coordinates"
                    >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                            {formattedCoords}
                        </p>
                    </button>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                    <button
                        onClick={openDirections}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5",
                            "h-9 rounded-xl text-xs font-medium",
                            "bg-tempest-500 text-white hover:bg-tempest-600 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                    >
                        <Navigation className="w-3.5 h-3.5" />
                        Directions
                    </button>

                    <button
                        className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center",
                            "bg-surface-subtle border border-border/50 hover:bg-surface-elevated",
                            "text-muted-foreground hover:text-foreground transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        aria-label="Save place"
                    >
                        <Bookmark className="w-4 h-4" />
                    </button>

                    <button
                        className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center",
                            "bg-surface-subtle border border-border/50 hover:bg-surface-elevated",
                            "text-muted-foreground hover:text-foreground transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        onClick={() => {
                            const url = `https://www.openstreetmap.org/#map=17/${coords.lat}/${coords.lng}`;
                            window.open(url, "_blank");
                        }}
                        aria-label="Open in OpenStreetMap"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}