"use client";

import MapView from "./components/map/MapView";
import NavOverlay from "./components/map/NavOverlay";

export default function Home() {
  return (
    <div>
      <NavOverlay />
      <MapView />
    </div>
  );
}
