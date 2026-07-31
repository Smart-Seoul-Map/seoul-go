import { useMemo } from "react";

import type { DistrictExplorationTarget } from "@features/exploration";
import {
  SMART_SEOUL_PLACE_THEMES,
  createPlaceThemeProgressItems,
  createPlacesFeatureCollection,
  filterSmartSeoulPlacesByDistrict,
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
  const placeMarkers = useMemo(() => createPlacesFeatureCollection(places), [places]);
  const themeProgressItems = useMemo(
    () =>
      createPlaceThemeProgressItems({
        places,
        themes: SMART_SEOUL_PLACE_THEMES,
      }),
    [places]
  );

  return {
    isError: placesQuery.isError,
    isLoading: placesQuery.isLoading,
    placeMarkers,
    places,
    themeProgressItems,
  };
}
