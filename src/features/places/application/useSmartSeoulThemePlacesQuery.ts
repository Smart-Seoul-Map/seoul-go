import { useQuery } from "@tanstack/react-query";

import { SMART_SEOUL_PLACE_THEME_IDS } from "../config/placeThemeConfig";
import { SMART_SEOUL_THEME_PLACES_STALE_TIME_MS } from "../config/smartSeoulThemeApiConfig";
import {
  fetchSmartSeoulThemePlaces,
  getSmartSeoulThemeApiKey,
  type SmartSeoulThemeContentsSearchArea,
} from "../data/smartSeoulThemeApi";
import { placesQueryKeys } from "./placesQueryKeys";

type NearbySmartSeoulThemePlacesQueryOptions = {
  staleTimeMs?: number;
};

export function useSmartSeoulThemePlacesQuery() {
  const apiKey = getSmartSeoulThemeApiKey();

  return useQuery({
    queryKey: placesQueryKeys.smartSeoulThemePlaces(SMART_SEOUL_PLACE_THEME_IDS),
    queryFn: () => fetchSmartSeoulThemePlaces({ apiKey }),
    enabled: Boolean(apiKey),
    staleTime: SMART_SEOUL_THEME_PLACES_STALE_TIME_MS,
  });
}

export function useNearbySmartSeoulThemePlacesQuery(
  searchArea: SmartSeoulThemeContentsSearchArea | null,
  {
    staleTimeMs = SMART_SEOUL_THEME_PLACES_STALE_TIME_MS,
  }: NearbySmartSeoulThemePlacesQueryOptions = {}
) {
  const apiKey = getSmartSeoulThemeApiKey();
  const queryKey = searchArea
    ? placesQueryKeys.nearbySmartSeoulThemePlaces({
        ...searchArea,
        themeIds: SMART_SEOUL_PLACE_THEME_IDS,
      })
    : ([...placesQueryKeys.all, "nearbySmartSeoulThemePlaces", "idle"] as const);

  return useQuery({
    queryKey,
    queryFn: () => (searchArea ? fetchSmartSeoulThemePlaces({ apiKey, searchArea }) : []),
    enabled: Boolean(apiKey && searchArea),
    staleTime: staleTimeMs,
  });
}
