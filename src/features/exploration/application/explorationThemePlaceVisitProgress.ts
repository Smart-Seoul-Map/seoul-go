import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

const ALL_PLACES_PROGRESS_ITEM_ID = "all";

export type ExplorationThemePlaceVisitProgressItem = {
  id: string;
  markerColor: string | null;
  markerColorToken: string | null;
  name: string;
  totalCount: number;
  visitedCount: number;
};

type ApplyVisitedPlaceCountsToThemeProgressItemsParams = {
  placeMarkers: MapMarkerFeatureCollection;
  themeProgressItems: readonly ExplorationThemePlaceVisitProgressItem[];
  visitedPlaceIds: ReadonlySet<string>;
};

export function applyVisitedPlaceCountsToThemeProgressItems({
  placeMarkers,
  themeProgressItems,
  visitedPlaceIds,
}: ApplyVisitedPlaceCountsToThemeProgressItemsParams): ExplorationThemePlaceVisitProgressItem[] {
  const visitedPlaceCountByThemeId = countVisitedPlacesByThemeId({
    placeMarkers,
    visitedPlaceIds,
  });
  const totalVisitedPlaceCount = Array.from(visitedPlaceCountByThemeId.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  return themeProgressItems.map((item) => ({
    ...item,
    visitedCount:
      item.id === ALL_PLACES_PROGRESS_ITEM_ID
        ? totalVisitedPlaceCount
        : (visitedPlaceCountByThemeId.get(item.id) ?? 0),
  }));
}

function countVisitedPlacesByThemeId({
  placeMarkers,
  visitedPlaceIds,
}: Pick<
  ApplyVisitedPlaceCountsToThemeProgressItemsParams,
  "placeMarkers" | "visitedPlaceIds"
>): ReadonlyMap<string, number> {
  const visitedPlaceCountByThemeId = new Map<string, number>();

  placeMarkers.features.forEach((feature) => {
    if (!visitedPlaceIds.has(feature.properties.id)) {
      return;
    }

    const themeId = feature.properties.themeId;
    visitedPlaceCountByThemeId.set(themeId, (visitedPlaceCountByThemeId.get(themeId) ?? 0) + 1);
  });

  return visitedPlaceCountByThemeId;
}
