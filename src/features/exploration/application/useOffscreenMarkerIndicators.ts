import { useEffect, useState } from "react";
import type maplibregl from "maplibre-gl";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { OFFSCREEN_MARKER_INDICATOR_EDGE_INSET_PX } from "../config/explorationMapConfig";
import {
  createOffscreenMarkerIndicators,
  type OffscreenMarkerIndicator,
} from "./explorationOffscreenMarkers";

type UseOffscreenMarkerIndicatorsParams = {
  isEnabled: boolean;
  map: maplibregl.Map | null;
  placeMarkers: MapMarkerFeatureCollection;
  revealedPlaceIds: ReadonlySet<string>;
};

export function useOffscreenMarkerIndicators({
  isEnabled,
  map,
  placeMarkers,
  revealedPlaceIds,
}: UseOffscreenMarkerIndicatorsParams): OffscreenMarkerIndicator[] {
  const [indicators, setIndicators] = useState<OffscreenMarkerIndicator[]>([]);

  useEffect(() => {
    if (!map || !isEnabled) {
      return;
    }

    const updateIndicators = () => {
      const container = map.getContainer();
      const next = createOffscreenMarkerIndicators({
        edgeInset: OFFSCREEN_MARKER_INDICATOR_EDGE_INSET_PX,
        mapView: {
          bearingDegrees: map.getBearing(),
          center: map.getCenter(),
          pitchDegrees: map.getPitch(),
        },
        placeMarkers,
        projectToScreen: (lngLat) => map.project(lngLat),
        revealedPlaceIds,
        screenSize: { height: container.clientHeight, width: container.clientWidth },
      });

      setIndicators((previous) => (previous.length === 0 && next.length === 0 ? previous : next));
    };

    updateIndicators();
    map.on("move", updateIndicators);
    map.on("resize", updateIndicators);

    return () => {
      map.off("move", updateIndicators);
      map.off("resize", updateIndicators);
    };
  }, [isEnabled, map, placeMarkers, revealedPlaceIds]);

  return indicators;
}
