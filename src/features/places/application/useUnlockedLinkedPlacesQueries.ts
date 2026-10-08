import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type { NearbySmartSeoulPlace } from "../domain/nearbyPlace";
import type { PlaceCoordinates, SmartSeoulThemePlace } from "../domain/place";
import { linkedPlacesOptionsByTheme } from "./smartSeoulPlacesQueries";

function combinePlaces(results: UseQueryResult<NearbySmartSeoulPlace[]>[]): SmartSeoulThemePlace[] {
  const byId = new Map<string, SmartSeoulThemePlace>();
  for (const result of results) {
    for (const { place } of result.data ?? []) byId.set(place.id, place);
  }
  return Array.from(byId.values());
}

export function useUnlockedLinkedPlacesQueries(centers: readonly PlaceCoordinates[]) {
  const queries = useMemo(() => {
    const uniqueCenters = new Map(centers.map((center) => [`${center.lat},${center.lng}`, center]));
    return Array.from(uniqueCenters.values()).flatMap((center) =>
      linkedPlacesOptionsByTheme(center)
    );
  }, [centers]);

  return useQueries({ queries, combine: combinePlaces });
}
