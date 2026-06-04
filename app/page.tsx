// app/page.tsx
import dynamic from "next/dynamic";
import { MapLoadingScreen } from "@/components/map/MapLoadingScreen";

// Dynamically import the map shell — MapLibre requires browser APIs
const MapShell = dynamic(
    () => import("@/components/layout/MapShell").then((m) => m.MapShell),
    {
        ssr: false,
        loading: () => <MapLoadingScreen />,
    }
);

export default function HomePage() {
    return (
        <main className="h-full w-full overflow-hidden">
            <MapShell />
        </main>
    );
}