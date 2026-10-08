import { useQueries, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
  SEOUL_EDITION25_THEME_ID,
  SEOUL_EDITION_THEME_IDS,
  SMART_SEOUL_PLACE_THEME_IDS,
} from "../config/placeThemeConfig";
import type { SmartSeoulThemeContentsSearchArea } from "../data/smartSeoulThemeApi";
import { sortNearbyPlaces, type NearbySmartSeoulPlace } from "../domain/nearbyPlace";
import type { SmartSeoulThemePlace, PlaceCoordinates } from "../domain/place";
import {
  linkedPlacesOptionsByTheme,
  nearbyThemePlacesOptions,
  seoulEditionPlacesOptions,
  themePlacesOptions,
} from "./smartSeoulPlacesQueries";
import { placesQueryKeys } from "./placesQueryKeys";

type NearbySmartSeoulThemePlacesQueryOptions = {
  staleTimeMs?: number;
};

type LinkedPlacesQueryStatus = {
  isEnabled: boolean;
  isPending: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
};

export type LinkedPlacesQueryResult = LinkedPlacesQueryStatus &
  ({ isSuccess: true; data: NearbySmartSeoulPlace[] } | { isSuccess: false; data: undefined });

function combineLinkedPlaces(
  results: UseQueryResult<NearbySmartSeoulPlace[]>[]
): LinkedPlacesQueryResult {
  const isError = results.some((result) => result.isError);
  const status: LinkedPlacesQueryStatus = {
    isEnabled: results.length > 0 && results.every((result) => result.isEnabled),
    isPending: !isError && results.some((result) => result.isPending),
    isError,
    refetch: () =>
      Promise.all(results.filter((result) => result.isError).map((result) => result.refetch())),
  };
  const isSuccess = results.length > 0 && results.every((result) => result.isSuccess);

  if (!isSuccess) return { ...status, isSuccess: false, data: undefined };

  return {
    ...status,
    isSuccess: true,
    data: sortNearbyPlaces(results.flatMap((result) => result.data ?? [])),
  };
}

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

export function useLinkedPlacesQuery(center: PlaceCoordinates | null): LinkedPlacesQueryResult {
  return useQueries({
    queries: linkedPlacesOptionsByTheme(center),
    combine: combineLinkedPlaces,
  });
}
