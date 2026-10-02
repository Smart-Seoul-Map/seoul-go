import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import type { Coordinates } from "../domain/explorationGeo";
import {
  calculateGroundDirectionOnScreen,
  calculateOffscreenIndicatorPlacement,
  type ScreenPoint,
  type ScreenSize,
} from "../domain/explorationOffscreenIndicator";

export type OffscreenMarkerIndicator = {
  angleRadians: number;
  id: string;
  name: string;
  x: number;
  y: number;
};

type OffscreenMarkerMapView = {
  bearingDegrees: number;
  center: Coordinates;
  pitchDegrees: number;
};

type CreateOffscreenMarkerIndicatorsParams = {
  edgeInset: number;
  mapView: OffscreenMarkerMapView;
  placeMarkers: MapMarkerFeatureCollection;
  projectToScreen: (lngLat: [number, number]) => ScreenPoint;
  revealedPlaceIds: ReadonlySet<string>;
  screenSize: ScreenSize;
};

export function createOffscreenMarkerIndicators({
  edgeInset,
  mapView,
  placeMarkers,
  projectToScreen,
  revealedPlaceIds,
  screenSize,
}: CreateOffscreenMarkerIndicatorsParams): OffscreenMarkerIndicator[] {
  return placeMarkers.features.flatMap((feature) => {
    if (revealedPlaceIds.has(feature.properties.id)) {
      return [];
    }

    const [lng, lat] = feature.geometry.coordinates;
    const placement = calculateOffscreenIndicatorPlacement({
      edgeInset,
      groundDirection: calculateGroundDirectionOnScreen({
        bearingDegrees: mapView.bearingDegrees,
        from: mapView.center,
        pitchDegrees: mapView.pitchDegrees,
        to: { lat, lng },
      }),
      projectedPoint: projectToScreen(feature.geometry.coordinates),
      screenSize,
    });

    if (!placement) {
      return [];
    }

    return [{ ...placement, id: feature.properties.id, name: feature.properties.name }];
  });
}
