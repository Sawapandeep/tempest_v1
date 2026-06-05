// app/page.tsx
import dynamic from "next/dynamic";
import { MapLoadingScreen } from "@/components/map/MapLoadingScreen";
import { MapShell } from "./components/layout/MapShell";
// import MapShellC from "@/components/layout/MapShell";
// Dynamically import the map shell — MapLibre requires browser APIs
export default function HomePage() {
    return (
        <main className="h-full w-full overflow-hidden">
            <MapShell />
        </main>
    );
}