import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEOUL_EDITION25_THEME_ID,
  SEOUL_EDITION_THEME_IDS,
  SMART_SEOUL_PLACE_THEME_IDS,
} from "../config/placeThemeConfig";
import type { SmartSeoulThemeContentsSearchArea } from "../data/smartSeoulThemeApi";
import type { SmartSeoulThemePlace, PlaceCoordinates } from "../domain/place";
import {
  linkedPlacesOptions,
  nearbyThemePlacesOptions,
  seoulEditionPlacesOptions,
  themePlacesOptions,
} from "./smartSeoulPlacesQueries";
import { placesQueryKeys } from "./placesQueryKeys";

type NearbySmartSeoulThemePlacesQueryOptions = {
  staleTimeMs?: number;
};

export function useSmartSeoulThemePlacesQuery() {
  return useQuery(themePlacesOptions());
}

export function useNearbySmartSeoulThemePlacesQuery(
  searchArea: SmartSeoulThemeContentsSearchArea | null,
  { staleTimeMs }: NearbySmartSeoulThemePlacesQueryOptions = {}
) {
  const options = nearbyThemePlacesOptions(searchArea);
  return useQuery({ ...options, staleTime: staleTimeMs ?? options.staleTime });
}

export function useSeoulEditionPlacesQuery() {
  return useQuery(seoulEditionPlacesOptions());
}

export function useNearbySeoulEditionPlacesQuery(searchArea: SmartSeoulThemeContentsSearchArea) {
  const client = useQueryClient();
  const sourceKey = placesQueryKeys.nearbySmartSeoulThemePlaces({
    ...searchArea,
    themeIds: SMART_SEOUL_PLACE_THEME_IDS,
  });
  return useQuery({
    ...nearbyThemePlacesOptions(searchArea, SEOUL_EDITION_THEME_IDS),
    initialData: () =>
      client
        .getQueryData<SmartSeoulThemePlace[]>(sourceKey)
        ?.filter((place) => place.themeId === SEOUL_EDITION25_THEME_ID),
    initialDataUpdatedAt: () => client.getQueryState(sourceKey)?.dataUpdatedAt,
  });
}

export function useLinkedPlacesQuery(center: PlaceCoordinates | null) {
  return useQuery(linkedPlacesOptions(center));
}
