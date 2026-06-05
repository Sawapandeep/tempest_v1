"use client";
// app/components/map/LayerSwitcher.tsx

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Mountain, Satellite, Car, Train, Layers, X } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import { MAP_LAYERS } from "@/lib/map-config";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import type { MapLayerType } from "@/types/map";

const LAYER_ICONS: Record<string, React.ElementType> = {
  Map, Mountain, Satellite, Car, Train,
};

export function LayerSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeLayer, setActiveLayer } = useMapStore();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSelectLayer = (layer: (typeof MAP_LAYERS)[0]) => {
    if (!layer.available) return;
    setActiveLayer(layer.id as MapLayerType, layer.styleUrl);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  // Mobile: render as a bottom sheet overlay
  if (isMobile) {
    return (
      <>
        {/* Floating layers button for mobile (shown in MapShell) */}
        <motion.button
          ref={buttonRef}
          onClick={() => setIsOpen((o) => !o)}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle map layers"
          aria-expanded={isOpen}
          className={cn(
            "glass rounded-2xl flex items-center gap-2 px-3 py-2.5",
            "text-sm font-medium transition-all duration-150",
            isOpen ? "text-tempest-400" : "text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Layers</span>
        </motion.button>

        {/* Mobile overlay panel — fixed position, centered, above everything */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[100]"
                onClick={() => setIsOpen(false)}
              />

              {/* Panel — fixed to bottom of screen, full width */}
              <motion.div
                ref={panelRef}
                key="mobile-layers"
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 80 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed bottom-0 left-0 right-0 z-[101] glass rounded-t-3xl p-4 pb-8"
                role="listbox"
                aria-label="Map layers"
              >
                {/* Handle */}
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-4 px-1">
                  <p className="text-sm font-semibold text-foreground">Map Style</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close layers panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {MAP_LAYERS.map((layer) => {
                    const Icon = LAYER_ICONS[layer.icon] ?? Map;
                    const isActive = activeLayer === layer.id;
                    return (
                      <motion.button
                        key={layer.id}
                        onClick={() => handleSelectLayer(layer)}
                        whileTap={{ scale: layer.available ? 0.93 : 1 }}
                        role="option"
                        aria-selected={isActive}
                        aria-disabled={!layer.available}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl shrink-0 w-20",
                          "transition-all duration-150",
                          isActive
                            ? "bg-tempest-500/20 text-tempest-400 border border-tempest-500/40"
                            : layer.available
                              ? "bg-surface-subtle border border-border/50 text-muted-foreground"
                              : "bg-surface-subtle border border-border/30 text-muted-foreground/40 cursor-not-allowed"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isActive ? "bg-tempest-500/10" : "bg-surface-elevated"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium leading-none text-center">
                          {layer.label}
                        </span>
                        {!layer.available && (
                          <span className="text-[8px] opacity-50">Soon</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: popup above the button
  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="desktop-layers"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-12 left-0 glass rounded-2xl p-2 flex gap-2 min-w-max z-50"
            role="listbox"
            aria-label="Map layers"
          >
            {MAP_LAYERS.map((layer) => {
              const Icon = LAYER_ICONS[layer.icon] ?? Map;
              const isActive = activeLayer === layer.id;
              return (
                <motion.button
                  key={layer.id}
                  onClick={() => handleSelectLayer(layer)}
                  whileTap={{ scale: layer.available ? 0.93 : 1 }}
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={!layer.available}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl",
                    "transition-all duration-150 min-w-[64px]",
                    isActive
                      ? "bg-tempest-500/20 text-tempest-400"
                      : layer.available
                        ? "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        : "text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      isActive
                        ? "border-tempest-500/50 bg-tempest-500/10"
                        : "border-border bg-surface-subtle"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-none">
                    {layer.label}
                  </span>
                  {!layer.available && (
                    <span className="text-[8px] opacity-50">Soon</span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        whileTap={{ scale: 0.93 }}
        aria-label="Toggle map layers"
        aria-expanded={isOpen}
        className={cn(
          "glass rounded-2xl flex items-center gap-2 px-3 py-2.5",
          "text-sm font-medium transition-all duration-150",
          isOpen ? "text-tempest-400" : "text-foreground hover:text-tempest-300"
        )}
      >
        <Layers className="w-4 h-4" />
        <span>Layers</span>
      </motion.button>
    </div>
  );
}