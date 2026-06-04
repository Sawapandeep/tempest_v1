"use client";
// src/components/layout/MapShell.tsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Sidebar } from "@/components/layout/Sidebar";
import { MapControls } from "@/components/map/MapControls";
import { LayerSwitcher } from "@/components/map/LayerSwitcher";
import { ScaleIndicator } from "@/components/map/ScaleIndicator";
import { SearchBar } from "@/features/search/components/SearchBar";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";
import { useMapStore } from "@/store/mapStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function MapShell() {
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On desktop sidebar is always visible, on mobile it's a bottom sheet
  const showSidebar = !isMobile;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* ── Map Canvas (always full screen) ── */}
      <MapCanvas />

      {/* ── Desktop Layout ── */}
      {showSidebar && (
        <AnimatePresence>
          <motion.aside
            key="sidebar"
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute left-0 top-0 h-full w-[360px] z-20 pointer-events-none"
          >
            <Sidebar />
          </motion.aside>
        </AnimatePresence>
      )}

      {/* ── Mobile Search Bar (top) ── */}
      {isMobile && (
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
          <SearchBar compact />
        </div>
      )}

      {/* ── Map Controls (right side) ── */}
      <div
        className={`
          absolute z-20 flex flex-col gap-2 pointer-events-auto
          ${isMobile ? "right-3 bottom-36" : "right-4 bottom-10"}
        `}
      >
        <MapControls />
      </div>

      {/* ── Layer Switcher (bottom-left on desktop) ── */}
      {!isMobile && (
        <div className="absolute bottom-6 left-[376px] z-20 pointer-events-auto">
          <LayerSwitcher />
        </div>
      )}

      {/* ── Scale Indicator ── */}
      <div
        className={`
          absolute z-10 pointer-events-none
          ${isMobile ? "bottom-28 left-3" : "bottom-6 right-[108px]"}
        `}
      >
        <ScaleIndicator />
      </div>

      {/* ── Mobile Bottom Sheet ── */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <MobileBottomSheet />
        </div>
      )}

      {/* ── Map overlay fade when loading ── */}
      <AnimatePresence>
        {!isMapLoaded && (
          <motion.div
            key="map-overlay"
            className="absolute inset-0 z-50 bg-background pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}