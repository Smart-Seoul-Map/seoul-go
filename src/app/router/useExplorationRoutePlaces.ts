import { useMemo } from "react";

import type { DistrictExplorationTarget } from "@features/exploration";
import {
  createSeoulEdition25MapContent,
  filterSmartSeoulPlacesByDistrict,
  useSeoulEditionPlacesQuery,
  type PlaceThemeProgressItem,
  type SmartSeoulThemePlace,
} from "@features/places";
import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

export type ExplorationRoutePlacesResult = {
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  placeMarkers: MapMarkerFeatureCollection;
  places: SmartSeoulThemePlace[];
  themeProgressItems: PlaceThemeProgressItem[];
};

export function useDistrictExplorationRoutePlaces(
  target: DistrictExplorationTarget | null
): ExplorationRoutePlacesResult {
  const placesQuery = useSeoulEditionPlacesQuery();
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
    isSuccess: placesQuery.isSuccess,
    ...mapContent,
    places,
  };
}
