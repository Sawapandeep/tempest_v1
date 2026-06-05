// app/page.tsx
import { MapShell } from "@/app/components/layout/MapShell";

export default function HomePage() {
    return (
        <main className="h-full w-full overflow-hidden">
            <MapShell />
        </main>
    );
}