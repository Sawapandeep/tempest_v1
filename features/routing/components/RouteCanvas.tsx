"use client";
// features/routing/components/RouteCanvas.tsx

import { useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import { useMapStore } from "@/store/mapStore";
import {
    addRouteLayer,
    removeRouteLayer,
} from "@/features/routing/services/routeLayerService";

/**
 * Invisible component that synchronizes the route store's
 * geometry to MapLibre GL layers.  Mount it once inside MapShell.
 */
export function RouteCanvas() {
    const { routes, activeRouteIndex, isVisible } = useRouteStore();
    const { mapInstance, isMapLoaded } = useMapStore();

    useEffect(() => {
        if (!mapInstance || !isMapLoaded) return;

        if (!isVisible || routes.length === 0) {
            removeRouteLayer(mapInstance);
            return;
        }

        const render = () => {
            addRouteLayer(mapInstance, routes, activeRouteIndex);
        };

        if (mapInstance.isStyleLoaded()) {
            render();
        } else {
            mapInstance.once("styledata", render);
            return () => {
                mapInstance.off("styledata", render)
            };
        }
    }, [mapInstance, isMapLoaded, routes, activeRouteIndex, isVisible]);

    return null;
}