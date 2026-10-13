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
  previousPosition: Coordinates | null;
};

export function findNearestArrivedPlaceMarker({
  arrivalRadiusMeters,
  placeMarkers,
  position,
  previousPosition,
}: FindNearestArrivedPlaceMarkerParams): ExplorationPlaceMarkerSelection | null {
  let nearestPlace: ExplorationPlaceMarkerSelection | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const feature of placeMarkers.features) {
    const place = getExplorationPlaceMarkerSelection(feature);

    if (!place) {
      continue;
    }

    const distance = distanceMeters(position, place.position);
    const wasInside =
      previousPosition !== null &&
      distanceMeters(previousPosition, place.position) <= arrivalRadiusMeters;

    if (!wasInside && distance <= arrivalRadiusMeters && distance < nearestDistance) {
      nearestPlace = place;
      nearestDistance = distance;
    }
  }

  return nearestPlace;
}
