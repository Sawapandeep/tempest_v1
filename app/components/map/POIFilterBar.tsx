"use client";
// components/map/POIFilterBar.tsx

import { cn } from "@/lib/utils";
import { POI_CATEGORIES } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import GlassPanel from "../ui/GlassPanel";

export default function POIFilterBar() {
    const { mapSettings, updateMapSettings } = useAppStore();

    const toggleMap: Record<string, keyof typeof mapSettings> = {
        petrol: "showPetrolPumps",
        washroom: "showWashrooms",
        mechanic: "showMechanics",
        hospital: "showHospitals",
        food: "showFoodStops",
        scenic: "showScenicSpots",
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {POI_CATEGORIES.map((cat) => {
                const key = toggleMap[cat.key] as keyof typeof mapSettings;
                const active = mapSettings[key] as boolean;

                return (
                    <button
                        key={cat.key}
                        onClick={() => updateMapSettings({ [key]: !active })}
                        className={cn(
                            "flex-shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-xl",
                            "text-xs font-display font-semibold transition-all duration-200",
                            "active:scale-95 select-none",
                            active
                                ? "text-amoled-black"
                                : "glass text-white/60 hover:text-white"
                        )}
                        style={
                            active
                                ? {
                                    background: cat.color,
                                    boxShadow: `0 0 12px ${cat.color}50`,
                                }
                                : undefined
                        }
                    >
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                );
            })}
        </div>
    );
}