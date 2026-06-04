"use client";
// src/components/map/LayerSwitcher.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Mountain, Satellite, Car, Train, Layers } from "lucide-react";
import { useMapStore } from "@/store/mapStore";
import { MAP_LAYERS } from "@/lib/map-config";
import { cn } from "@/lib/utils";
import type { MapLayerType } from "@/types/map";

const LAYER_ICONS: Record<string, React.ElementType> = {
  Map, Mountain, Satellite, Car, Train,
};

export function LayerSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeLayer, setActiveLayer } = useMapStore();

  const handleSelectLayer = (layer: typeof MAP_LAYERS[0]) => {
    if (!layer.available) return;
    setActiveLayer(layer.id as MapLayerType, layer.styleUrl);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Layers panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-12 left-0 glass rounded-2xl p-2 flex gap-2 min-w-max"
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

      {/* Toggle button */}
      <motion.button
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