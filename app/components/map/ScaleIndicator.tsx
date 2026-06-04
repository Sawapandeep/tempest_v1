"use client";
// src/components/map/ScaleIndicator.tsx

import { useEffect, useState } from "react";
import { useMapStore } from "@/store/mapStore";
import { useSettingsStore } from "@/store/settingsStore";

function getScaleInfo(
  zoom: number,
  lat: number,
  imperial: boolean
): { width: number; label: string } {
  // Meters per pixel at given zoom and latitude
  const metersPerPx =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

  const targetWidthPx = 80; // target bar width in px
  const totalMeters = metersPerPx * targetWidthPx;

  if (imperial) {
    const feet = totalMeters * 3.28084;
    if (feet < 528) {
      const rounded = Math.round(feet / 50) * 50 || 50;
      return { width: rounded / (metersPerPx * 3.28084), label: `${rounded} ft` };
    }
    const miles = feet / 5280;
    const rounded = miles < 2 ? Math.round(miles * 10) / 10 : Math.round(miles);
    return { width: (rounded * 1609.34) / metersPerPx, label: `${rounded} mi` };
  }

  if (totalMeters < 1000) {
    const rounded = Math.round(totalMeters / 10) * 10 || 10;
    return { width: rounded / metersPerPx, label: `${rounded} m` };
  }
  const km = totalMeters / 1000;
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return { width: (rounded * 1000) / metersPerPx, label: `${rounded} km` };
}

export function ScaleIndicator() {
  const { viewState } = useMapStore();
  const unitSystem = useSettingsStore((s) => s.unitSystem);
  const [scale, setScale] = useState<{ width: number; label: string } | null>(null);

  useEffect(() => {
    const info = getScaleInfo(
      viewState.zoom,
      viewState.center.lat,
      unitSystem === "imperial"
    );
    setScale(info);
  }, [viewState.zoom, viewState.center.lat, unitSystem]);

  if (!scale) return null;

  return (
    <div
      className="flex flex-col items-start gap-0.5 select-none"
      aria-label={`Map scale: ${scale.label}`}
    >
      {/* Bar */}
      <div
        className="h-[3px] bg-foreground/60 rounded-sm border-x border-b border-foreground/60"
        style={{ width: `${Math.round(scale.width)}px`, minWidth: 40, maxWidth: 120 }}
      />
      {/* Label */}
      <span className="text-[10px] font-medium text-foreground/70 tabular-nums">
        {scale.label}
      </span>
    </div>
  );
}