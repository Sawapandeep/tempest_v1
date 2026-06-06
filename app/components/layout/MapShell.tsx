"use client";
// app/components/layout/MapShell.tsx

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapCanvas } from "@/app/components/map/MapCanvas";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { MapControls } from "@/app/components/map/MapControls";
import { ScaleIndicator } from "@/app/components/map/ScaleIndicator";
import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchResults } from "@/features/search/components/SearchResults";
import { MobileBottomSheet } from "@/app/components/layout/MobileBottomSheet";
import { PlaceDetailPanel } from "@/app/components/map/PlaceDetailPanel";
import { SelectedPlaceMarker } from "@/app/components/map/SelectedPlaceMarker";
import { RouteCanvas } from "@/features/routing/components/RouteCanvas";
import { RoutingPanel } from "@/features/routing/components/RoutingPanel";
import { useMapStore } from "@/store/mapStore";
import { useSearchStore } from "@/store/searchStore";
import { useRouteStore } from "@/store/routeStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function MapShell() {
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const selectedPlace = useMapStore((s) => s.selectedPlace);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isOpen: searchOpen, query, results, isSearching } = useSearchStore();
  const isPanelOpen = useRouteStore((s) => s.isPanelOpen);
  const [showRoutingPanel, setShowRoutingPanel] = useState(false);

  const showMobileSearchDropdown =
    isMobile && searchOpen && (query.length > 0 || results.length > 0 || isSearching);

  const openRouting = () => setShowRoutingPanel(true);
  const closeRouting = () => {
    setShowRoutingPanel(false);
    useRouteStore.getState().clearRoute();
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Map layer */}
      <MapCanvas />
      <SelectedPlaceMarker />

      {/* Route polyline layer — mounts after map is ready */}
      <RouteCanvas />

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <AnimatePresence>
          <motion.aside
            key="sidebar"
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute left-0 top-0 h-full w-[360px] z-20 pointer-events-none"
          >
            <Sidebar onOpenRouting={openRouting} />
          </motion.aside>
        </AnimatePresence>
      )}

      {/* ── Mobile search bar + dropdown ── */}
      {isMobile && (
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
          <SearchBar compact />
          <AnimatePresence>
            {showMobileSearchDropdown && (
              <motion.div
                key="mobile-search-dropdown"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="mt-2 glass rounded-2xl overflow-hidden shadow-tempest-lg max-h-[55vh] overflow-y-auto scrollbar-thin"
                role="listbox"
              >
                <SearchResults />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Map controls (right side) ── */}
      <div
        className={`absolute z-20 flex flex-col gap-2 pointer-events-auto ${isMobile ? "right-3 bottom-36" : "right-4 bottom-10"
          }`}
      >
        <MapControls />
      </div>

      {/* ── Routing panel (desktop: left sidebar area; mobile: top) ── */}
      <AnimatePresence>
        {showRoutingPanel && (
          <motion.div
            key="routing-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute pointer-events-auto z-40 ${isMobile
                ? "top-20 left-3 right-3"
                : "top-4 left-[376px] w-[360px]"
              }`}
          >
            <RoutingPanel onClose={closeRouting} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Place detail panel ── */}
      <AnimatePresence>
        {selectedPlace && !showRoutingPanel && (
          <div
            className={`absolute pointer-events-auto z-30 ${isMobile
                ? "bottom-24 left-3 right-3"
                : "bottom-20 left-[376px]"
              }`}
          >
            <PlaceDetailPanel onGetDirections={openRouting} />
          </div>
        )}
      </AnimatePresence>

      {/* ── Scale indicator ── */}
      <div
        className={`absolute z-10 pointer-events-none ${isMobile ? "bottom-28 left-3" : "bottom-6 right-28"
          }`}
      >
        <ScaleIndicator />
      </div>

      {/* ── Mobile bottom sheet ── */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
          <MobileBottomSheet />
        </div>
      )}

      {/* ── Map loading fade overlay ── */}
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