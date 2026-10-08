import { queryOptions } from "@tanstack/react-query";

import {
  LINKED_PLACE_THEME_IDS,
  SEOUL_EDITION_THEME_IDS,
  SMART_SEOUL_PLACE_THEME_IDS,
} from "../config/placeThemeConfig";
import {
  LINKED_PLACE_RADIUS_METERS,
  SMART_SEOUL_NEARBY_PLACES_STALE_TIME_MS,
  SMART_SEOUL_THEME_PLACES_GC_TIME_MS,
  SMART_SEOUL_THEME_PLACES_STALE_TIME_MS,
} from "../config/smartSeoulThemeApiConfig";
import {
  fetchSmartSeoulThemePlaces,
  getNearbySmartSeoulPlaces,
  getSmartSeoulThemeApiKey,
  type SmartSeoulThemeContentsSearchArea,
} from "../data/smartSeoulThemeApi";
import type { PlaceCoordinates } from "../domain/place";
import { placesQueryKeys } from "./placesQueryKeys";

const cachePolicy = { gcTime: SMART_SEOUL_THEME_PLACES_GC_TIME_MS, retry: false as const };

export function themePlacesOptions(themeIds: readonly string[] = SMART_SEOUL_PLACE_THEME_IDS) {
  const apiKey = getSmartSeoulThemeApiKey();
  return queryOptions({
    ...cachePolicy,
    queryKey: placesQueryKeys.smartSeoulThemePlaces(themeIds),
    queryFn: ({ signal }) => fetchSmartSeoulThemePlaces({ apiKey, themeIds, signal }),
    enabled: Boolean(apiKey),
    staleTime: SMART_SEOUL_THEME_PLACES_STALE_TIME_MS,
  });
}

export function seoulEditionPlacesOptions() {
  return themePlacesOptions(SEOUL_EDITION_THEME_IDS);
}

export function nearbyThemePlacesOptions(
  searchArea: SmartSeoulThemeContentsSearchArea | null,
  themeIds: readonly string[] = SMART_SEOUL_PLACE_THEME_IDS
) {
  const apiKey = getSmartSeoulThemeApiKey();
  return queryOptions({
    ...cachePolicy,
    queryKey: searchArea
      ? placesQueryKeys.nearbySmartSeoulThemePlaces({ ...searchArea, themeIds })
      : [...placesQueryKeys.all, "nearbySmartSeoulThemePlaces", "idle", [...themeIds]],
    queryFn: ({ signal }) =>
      searchArea
        ? fetchSmartSeoulThemePlaces({ apiKey, searchArea, themeIds, signal })
        : Promise.resolve([]),
    enabled: Boolean(apiKey && searchArea),
    staleTime: SMART_SEOUL_NEARBY_PLACES_STALE_TIME_MS,
  });
}

export function linkedThemePlacesOptions(center: PlaceCoordinates, themeId: string) {
  const apiKey = getSmartSeoulThemeApiKey();
  const searchArea = { center, distanceMeters: LINKED_PLACE_RADIUS_METERS };
  return queryOptions({
    ...cachePolicy,
    queryKey: placesQueryKeys.linkedPlaces({ ...searchArea, themeId }),
    queryFn: ({ signal }) =>
      getNearbySmartSeoulPlaces({ apiKey, searchArea, themeIds: [themeId], signal }),
    enabled: Boolean(apiKey),
    staleTime: SMART_SEOUL_NEARBY_PLACES_STALE_TIME_MS,
  });
}

export function linkedPlacesOptionsByTheme(center: PlaceCoordinates | null) {
  if (!center) return [];

  return LINKED_PLACE_THEME_IDS.map((themeId) => linkedThemePlacesOptions(center, themeId));
}
