import { useMemo } from "react";

import type { DistrictExplorationTarget, StationExplorationTarget } from "@features/exploration";
import {
  createSeoulEdition25MapContent,
  filterSmartSeoulPlacesByDistrict,
  useNearbySmartSeoulThemePlacesQuery,
  useSmartSeoulThemePlacesQuery,
  type PlaceThemeProgressItem,
  type SmartSeoulThemePlace,
} from "@features/places";
import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

export type ExplorationRoutePlacesResult = {
  isError: boolean;
  isLoading: boolean;
  placeMarkers: MapMarkerFeatureCollection;
  places: SmartSeoulThemePlace[];
  selectionYearLabel: string;
  themeProgressItems: PlaceThemeProgressItem[];
};

export function useDistrictExplorationRoutePlaces(
  target: DistrictExplorationTarget | null
): ExplorationRoutePlacesResult {
  const placesQuery = useSmartSeoulThemePlacesQuery();
  const sourcePlaces = placesQuery.data ?? [];
  const places = useMemo(
    () =>
      target
        ? filterSmartSeoulPlacesByDistrict(sourcePlaces, target.districtName)
        : [...sourcePlaces],
    [sourcePlaces, target]
  );
  const mapContent = useMemo(() => createSeoulEdition25MapContent(places), [places]);

  return {
    isError: placesQuery.isError,
    isLoading: placesQuery.isLoading,
    ...mapContent,
    places,
  };
}

export function useStationExplorationRoutePlaces(
  target: StationExplorationTarget
): ExplorationRoutePlacesResult {
  const placesQuery = useNearbySmartSeoulThemePlacesQuery({
    center: target.center,
    distanceMeters: target.radiusMeters,
  });
  const places = placesQuery.data ?? [];
  const mapContent = useMemo(() => createSeoulEdition25MapContent(places), [places]);

  return {
    isError: placesQuery.isError,
    isLoading: placesQuery.isLoading,
    ...mapContent,
    places,
  };
}
