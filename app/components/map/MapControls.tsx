"use client";
// src/components/map/MapControls.tsx

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Compass, Maximize2, Minimize2,
  Locate, LocateFixed, Box,
} from "lucide-react";
import { useMapControls } from "@/hooks/useMapControls";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapStore } from "@/store/mapStore";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

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
  const { isLocating, isFollowingUser, isFullscreen, is3DMode } = useMapStore();

  const isNorth = Math.abs(currentBearing) < 0.5;

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="Map controls">
      {/* Zoom group */}
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

      {/* Locate me */}
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

      {/* 3D toggle */}
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
    </div>
  );
}