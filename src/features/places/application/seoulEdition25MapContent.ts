import { SEOUL_EDITION25_THEME_ID, SMART_SEOUL_PLACE_THEMES } from "../config/placeThemeConfig";
import type { SmartSeoulThemePlace } from "../domain/place";
import { createPlacesFeatureCollection } from "./placeGeoJson";
import { createPlaceThemeProgressItems } from "./placeThemeProgress";

export function createSeoulEdition25MapContent(places: readonly SmartSeoulThemePlace[]) {
  const editionPlaces = places.filter((place) => place.themeId === SEOUL_EDITION25_THEME_ID);
  const themes = SMART_SEOUL_PLACE_THEMES.filter((theme) => theme.id === SEOUL_EDITION25_THEME_ID);

  return {
    placeMarkers: createPlacesFeatureCollection(editionPlaces),
    themeProgressItems: createPlaceThemeProgressItems({ places: editionPlaces, themes })
      .filter((item) => item.id === SEOUL_EDITION25_THEME_ID)
      .map((item) => ({ ...item, markerColorToken: "--sg-color-text-info" })),
  };
}
