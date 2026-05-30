"use client";
// components/map/POIFilterBar.tsx
import { cn } from "@/lib/utils";
import { POI_CATEGORIES } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const toggleMap: Record<string, string> = {
    petrol: "showPetrolPumps",
    washroom: "showWashrooms",
    mechanic: "showMechanics",
    hospital: "showHospitals",
    food: "showFoodStops",
    scenic: "showScenicSpots",
};

export default function POIFilterBar() {
    const { mapSettings, updateMapSettings } = useAppStore();

    return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {POI_CATEGORIES.map((cat) => {
                const key = toggleMap[cat.key] as keyof typeof mapSettings;
                const active = mapSettings[key] as boolean;

                return (
                    <button
                        key={cat.key}
                        onClick={() => updateMapSettings({ [key]: !active })}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-display font-semibold transition-all duration-200 active:scale-95 select-none"
                        style={
                            active
                                ? {
                                    background: cat.color,
                                    color: "#000",
                                    boxShadow: `0 0 12px ${cat.color}60`,
                                }
                                : {
                                    // Always-dark chip — visible on any map tile
                                    background: "rgba(10,10,10,0.88)",
                                    backdropFilter: "blur(16px)",
                                    WebkitBackdropFilter: "blur(16px)",
                                    border: "1.5px solid rgba(255,255,255,0.14)",
                                    color: "rgba(255,255,255,0.70)",
                                }
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
