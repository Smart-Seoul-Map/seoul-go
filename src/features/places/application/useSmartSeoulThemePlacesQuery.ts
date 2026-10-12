import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { sortNearbyPlaces, type NearbySmartSeoulPlace } from "../domain/nearbyPlace";
import type { PlaceCoordinates } from "../domain/place";
import {
  linkedPlacesOptionsByTheme,
  seoulEditionPlacesOptions,
  themePlacesOptions,
} from "./smartSeoulPlacesQueries";

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

export function useSeoulEditionPlacesQuery() {
  return useQuery(seoulEditionPlacesOptions());
}

export function useLinkedPlacesQuery(center: PlaceCoordinates | null): LinkedPlacesQueryResult {
  return useQueries({
    queries: linkedPlacesOptionsByTheme(center),
    combine: combineLinkedPlaces,
  });
}
