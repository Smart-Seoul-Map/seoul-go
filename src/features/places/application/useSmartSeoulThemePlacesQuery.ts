import { useQuery } from "@tanstack/react-query";

import { SMART_SEOUL_PLACE_THEME_IDS } from "../config/placeThemeConfig";
import { SMART_SEOUL_THEME_PLACES_STALE_TIME_MS } from "../config/smartSeoulThemeApiConfig";
import { fetchSmartSeoulThemePlaces, getSmartSeoulThemeApiKey } from "../data/smartSeoulThemeApi";
import { placesQueryKeys } from "./placesQueryKeys";

export function useSmartSeoulThemePlacesQuery() {
  const apiKey = getSmartSeoulThemeApiKey();

  return useQuery({
    queryKey: placesQueryKeys.smartSeoulThemePlaces(SMART_SEOUL_PLACE_THEME_IDS),
    queryFn: () => fetchSmartSeoulThemePlaces({ apiKey }),
    enabled: Boolean(apiKey),
    staleTime: SMART_SEOUL_THEME_PLACES_STALE_TIME_MS,
  });
}
