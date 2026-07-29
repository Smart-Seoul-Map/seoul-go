import type { SmartSeoulThemePlace } from "../domain/place";

const ALL_PLACES_PROGRESS_ITEM_ID = "all";
const ALL_PLACES_PROGRESS_ITEM_NAME = "방문지";

type PlaceThemeProgressTheme = {
  id: string;
  markerColor: string;
  markerColorToken: string;
  name: string;
};

export type PlaceThemeProgressItem = {
  id: string;
  markerColor: string | null;
  markerColorToken: string | null;
  name: string;
  totalCount: number;
  visitedCount: number;
};

type CreatePlaceThemeProgressItemsParams = {
  places: readonly SmartSeoulThemePlace[];
  themes: readonly PlaceThemeProgressTheme[];
};

export function createPlaceThemeProgressItems({
  places,
  themes,
}: CreatePlaceThemeProgressItemsParams): PlaceThemeProgressItem[] {
  const placeCountByThemeId = countPlacesByThemeId(places);

  return [
    {
      id: ALL_PLACES_PROGRESS_ITEM_ID,
      markerColor: null,
      markerColorToken: null,
      name: ALL_PLACES_PROGRESS_ITEM_NAME,
      totalCount: places.length,
      visitedCount: 0,
    },
    ...themes.map((theme) => ({
      id: theme.id,
      markerColor: theme.markerColor,
      markerColorToken: theme.markerColorToken,
      name: theme.name,
      totalCount: placeCountByThemeId.get(theme.id) ?? 0,
      visitedCount: 0,
    })),
  ];
}

function countPlacesByThemeId(
  places: readonly SmartSeoulThemePlace[]
): ReadonlyMap<string, number> {
  const placeCountByThemeId = new Map<string, number>();

  places.forEach((place) => {
    placeCountByThemeId.set(place.themeId, (placeCountByThemeId.get(place.themeId) ?? 0) + 1);
  });

  return placeCountByThemeId;
}
