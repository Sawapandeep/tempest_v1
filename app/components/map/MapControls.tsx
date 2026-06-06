"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Compass, Maximize2, Minimize2,
  Locate, LocateFixed, Box, Layers, Map, Mountain, Satellite, Car, Train,
} from "lucide-react";
import { useMapControls } from "@/hooks/useMapControls";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapStore } from "@/store/mapStore";
import { MAP_LAYERS } from "@/lib/map-config";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState, useRef, useEffect } from "react";
import type { MapLayerType } from "@/types/map";

const LAYER_ICONS: Record<string, React.ElementType> = {
  Map, Mountain, Satellite, Car, Train,
};

function ControlButton({
  onClick,
  label,
  disabled,
  active,
  className,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.button
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: 0.9 }}
            aria-label={label}
            className={cn(
              "map-ctrl-btn glass",
              active && "text-tempest-400 bg-tempest-500/10",
              disabled && "opacity-40 cursor-not-allowed",
              className
            )}
          >
            {children}
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="left"
            sideOffset={8}
            className="glass rounded-lg px-2.5 py-1.5 text-xs text-foreground z-50 select-none"
          >
            {label}
            <Tooltip.Arrow className="fill-current text-border opacity-50" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function MapControls() {
  const {
    zoomIn, zoomOut, resetNorth, togglePitch, toggleFullscreen,
    currentBearing, isAtMaxZoom, isAtMinZoom,
  } = useMapControls();
  const { locate } = useGeolocation();
  const { isLocating, isFollowingUser, isFullscreen, is3DMode, activeLayer, setActiveLayer } = useMapStore();
  const [layersOpen, setLayersOpen] = useState(false);
  const layersPanelRef = useRef<HTMLDivElement>(null);
  const layersBtnRef = useRef<HTMLButtonElement>(null);

  const isNorth = Math.abs(currentBearing) < 0.5;

  // Close layers panel on outside click
  useEffect(() => {
    if (!layersOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        layersPanelRef.current &&
        !layersPanelRef.current.contains(e.target as Node) &&
        layersBtnRef.current &&
        !layersBtnRef.current.contains(e.target as Node)
      ) {
        setLayersOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [layersOpen]);

  const handleSelectLayer = (layer: (typeof MAP_LAYERS)[0]) => {
    if (!layer.available) return;
    setActiveLayer(layer.id as MapLayerType, layer.styleUrl);
    setLayersOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="Map controls">
      {/* Zoom controls */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col divide-y divide-border/50">
        <ControlButton
          onClick={zoomIn}
          label="Zoom in"
          disabled={isAtMaxZoom}
        >
          <Plus className="w-4 h-4" />
        </ControlButton>
        <ControlButton
          onClick={zoomOut}
          label="Zoom out"
          disabled={isAtMinZoom}
        >
          <Minus className="w-4 h-4" />
        </ControlButton>
      </div>

      {/* Compass */}
      <ControlButton
        onClick={resetNorth}
        label={isNorth ? "Compass — pointing north" : "Reset to north"}
        active={!isNorth}
        className="glass rounded-2xl"
      >
        <motion.div
          animate={{ rotate: -currentBearing }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Compass
            className={cn(
              "w-4 h-4 transition-colors",
              !isNorth ? "text-tempest-400" : "text-foreground"
            )}
          />
        </motion.div>
      </ControlButton>

      {/* Locate */}
      <ControlButton
        onClick={locate}
        label={isFollowingUser ? "Following your location" : "Go to my location"}
        active={isFollowingUser}
        className="glass rounded-2xl"
      >
        <AnimatePresence mode="wait">
          {isLocating ? (
            <motion.div
              key="locating"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Locate className="w-4 h-4 animate-pulse text-tempest-400" />
            </motion.div>
          ) : isFollowingUser ? (
            <motion.div
              key="following"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <LocateFixed className="w-4 h-4 text-tempest-400" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Locate className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </ControlButton>

      {/* 3D mode */}
      <ControlButton
        onClick={togglePitch}
        label={is3DMode ? "Exit 3D mode" : "Enable 3D mode"}
        active={is3DMode}
        className="glass rounded-2xl"
      >
        <Box className="w-4 h-4" />
      </ControlButton>

      {/* Fullscreen */}
      <ControlButton
        onClick={toggleFullscreen}
        label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="glass rounded-2xl"
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </ControlButton>

      {/* Layer Switcher — integrated at bottom of controls */}
      <div className="relative">
        {/* Layer picker panel — opens to the left */}
        <AnimatePresence>
          {layersOpen && (
            <motion.div
              ref={layersPanelRef}
              key="layers-panel"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-12 bottom-0 glass rounded-2xl p-2 flex flex-col gap-1 min-w-[72px] z-50"
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
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xl w-full text-left",
                      "transition-all duration-150",
                      isActive
                        ? "bg-tempest-500/20 text-tempest-400"
                        : layer.available
                          ? "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          : "text-muted-foreground/40 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center border shrink-0",
                        isActive
                          ? "border-tempest-500/50 bg-tempest-500/10"
                          : "border-border bg-surface-subtle"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-medium leading-none whitespace-nowrap">
                        {layer.label}
                      </span>
                      {!layer.available && (
                        <span className="text-[9px] opacity-50 mt-0.5">Soon</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                ref={layersBtnRef}
                onClick={() => setLayersOpen((o) => !o)}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle map layers"
                aria-expanded={layersOpen}
                className={cn(
                  "map-ctrl-btn glass rounded-2xl",
                  layersOpen && "text-tempest-400 bg-tempest-500/10"
                )}
              >
                <Layers className="w-4 h-4" />
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="left"
                sideOffset={8}
                className="glass rounded-lg px-2.5 py-1.5 text-xs text-foreground z-50 select-none"
              >
                Map layers
                <Tooltip.Arrow className="fill-current text-border opacity-50" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>
  );
}