"use client";
// features/routing/components/RouteCanvas.tsx

import { useEffect, useRef } from "react";
import { useRouteStore } from "@/store/routeStore";
import { useMapStore } from "@/store/mapStore";
import {
    addRouteLayer,
    removeRouteLayer,
} from "@/features/routing/services/routeLayerService";

export function RouteCanvas() {
    const { routes, activeRouteIndex, isVisible } = useRouteStore();
    const { mapInstance, isMapLoaded } = useMapStore();
    const pendingRef = useRef(false);

    useEffect(() => {
        if (!mapInstance || !isMapLoaded) return;

        const render = () => {
            if (!isVisible || routes.length === 0) {
                removeRouteLayer(mapInstance);
                return;
            }
            addRouteLayer(mapInstance, routes, activeRouteIndex);
        };

        if (mapInstance.isStyleLoaded()) {
            render();
        } else {
            const onStyleData = () => render();
            mapInstance.once("styledata", onStyleData);
            return () => {
                mapInstance.off("styledata", onStyleData);
            };
        }
    }, [mapInstance, isMapLoaded, routes, activeRouteIndex, isVisible]);

    // Clean up all route layers when component unmounts
    useEffect(() => {
        return () => {
            if (mapInstance) {
                removeRouteLayer(mapInstance);
            }
        };
    }, [mapInstance]);

    return null;
}