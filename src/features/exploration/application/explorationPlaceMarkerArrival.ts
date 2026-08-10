import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { distanceMeters, type Coordinates } from "../domain/explorationGeo";
import {
  getExplorationPlaceMarkerSelection,
  type ExplorationPlaceMarkerSelection,
} from "./explorationPlaceMarkers";

type FindNearestArrivedPlaceMarkerParams = {
  arrivalRadiusMeters: number;
  placeMarkers: MapMarkerFeatureCollection;
  position: Coordinates;
  revealedPlaceIds: ReadonlySet<string>;
};

export function findNearestArrivedPlaceMarker({
  arrivalRadiusMeters,
  placeMarkers,
  position,
  revealedPlaceIds,
}: FindNearestArrivedPlaceMarkerParams): ExplorationPlaceMarkerSelection | null {
  let nearestPlace: ExplorationPlaceMarkerSelection | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const feature of placeMarkers.features) {
    if (revealedPlaceIds.has(feature.properties.id)) {
      continue;
    }

    const place = getExplorationPlaceMarkerSelection(feature);

    if (!place) {
      continue;
    }

    const distance = distanceMeters(position, place.position);

    if (distance <= arrivalRadiusMeters && distance < nearestDistance) {
      nearestPlace = place;
      nearestDistance = distance;
    }
  }

  return nearestPlace;
}
