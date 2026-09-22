import { SEOUL_EDITION25_THEME_ID, SMART_SEOUL_PLACE_THEMES } from "../config/placeThemeConfig";
import type { SmartSeoulThemePlace } from "../domain/place";
import { createPlacesFeatureCollection } from "./placeGeoJson";
import { createPlaceThemeProgressItems } from "./placeThemeProgress";

export function createSeoulEdition25MapContent(places: readonly SmartSeoulThemePlace[]) {
  const editionPlaces = places.filter((place) => place.themeId === SEOUL_EDITION25_THEME_ID);
  const themes = SMART_SEOUL_PLACE_THEMES.filter((theme) => theme.id === SEOUL_EDITION25_THEME_ID);
  const selectionYears = [
    ...new Set(
      editionPlaces
        .map((place) => place.selectionYear)
        .filter((year): year is number => year !== undefined)
    ),
  ].sort((a, b) => a - b);

  return {
    placeMarkers: createPlacesFeatureCollection(editionPlaces),
    selectionYearLabel: [
      themes[0].name,
      ...selectionYears.map((year) => String(year).slice(-2)),
    ].join(" · "),
    themeProgressItems: createPlaceThemeProgressItems({ places: editionPlaces, themes })
      .filter((item) => item.id === SEOUL_EDITION25_THEME_ID)
      .map((item) => ({ ...item, markerColorToken: "--sg-color-text-info" })),
  };
}
