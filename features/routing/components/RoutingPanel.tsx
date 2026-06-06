"use client";
// features/routing/components/RoutingPanel.tsx

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RouteInputPanel } from "@/features/routing/components/RouteInputPanel";
import { RouteSummaryCard } from "@/features/routing/components/RouteSummaryCard";
import { DirectionsList } from "@/features/routing/components/DirectionsList";
import { useRouting } from "@/features/routing/hooks/useRouting";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface RoutingPanelProps {
    onClose: () => void;
    initialDestinationName?: string;
}

export function RoutingPanel({ onClose, initialDestinationName }: RoutingPanelProps) {
    const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
    const { routes, clearRoute, isRouting } = useRouting();
    const isMobile = useMediaQuery("(max-width: 768px)");

    const hasRoutes = routes.length > 0;

    const handleClose = () => {
        clearRoute();
        onClose();
    };

    const handleBack = () => {
        clearRoute();
        setIsDirectionsOpen(false);
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-2",
                isMobile ? "w-full" : "w-[360px]"
            )}
        >
            <AnimatePresence mode="popLayout">
                {/* Input — show when no routes yet */}
                {!hasRoutes && !isRouting && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <RouteInputPanel
                            onClose={handleClose}
                            initialDestinationName={initialDestinationName}
                        />
                    </motion.div>
                )}

                {/* Summary — show when routing or routes available */}
                {(hasRoutes || isRouting) && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-2"
                    >
                        <RouteSummaryCard
                            onBack={handleBack}
                            onShowDirections={() => setIsDirectionsOpen((o) => !o)}
                            isDirectionsOpen={isDirectionsOpen}
                        />

                        <DirectionsList
                            isExpanded={isDirectionsOpen}
                            onToggle={() => setIsDirectionsOpen((o) => !o)}
                            maxHeight={isMobile ? "40vh" : "55vh"}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}