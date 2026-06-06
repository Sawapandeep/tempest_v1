"use client";
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
import { useMapStore } from "@/store/mapStore";
import { useSearchStore } from "@/store/searchStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function MapShell() {
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const selectedPlace = useMapStore((s) => s.selectedPlace);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isOpen: searchOpen, query, results, isSearching } = useSearchStore();

  const showMobileSearchDropdown =
    isMobile && searchOpen && (query.length > 0 || results.length > 0 || isSearching);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Map canvas */}
      <MapCanvas />
      <SelectedPlaceMarker />

      {/* Desktop sidebar */}
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
            <Sidebar />
          </motion.aside>
        </AnimatePresence>
      )}

      {/* Mobile: search bar + dropdown results */}
      {isMobile && (
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
          <SearchBar compact />

          {/* Results dropdown — appears directly below search bar, above keyboard */}
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

      {/* Map controls — LayerSwitcher is now embedded inside MapControls */}
      <div
        className={`absolute z-20 flex flex-col gap-2 pointer-events-auto ${isMobile ? "right-3 bottom-36" : "right-4 bottom-10"
          }`}
      >
        <MapControls />
      </div>

      {/* Place detail panel */}
      <AnimatePresence>
        {selectedPlace && (
          <div
            className={`absolute pointer-events-auto z-30 ${isMobile
                ? "bottom-24 left-3 right-3"
                : "bottom-20 left-[376px]"
              }`}
          >
            <PlaceDetailPanel />
          </div>
        )}
      </AnimatePresence>

      {/* Scale indicator */}
      <div
        className={`absolute z-10 pointer-events-none ${isMobile ? "bottom-28 left-3" : "bottom-6 right-28"
          }`}
      >
        <ScaleIndicator />
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
          <MobileBottomSheet />
        </div>
      )}

      {/* Map loading overlay */}
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