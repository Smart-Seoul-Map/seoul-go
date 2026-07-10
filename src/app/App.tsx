import { ExplorationPage } from "@features/exploration";
import {
  SMART_SEOUL_PLACE_THEMES,
  createPlacesFeatureCollection,
  createPlaceThemeProgressItems,
  useSmartSeoulThemePlacesQuery,
} from "@features/places";
import type { ReactElement } from "react";

export function App(): ReactElement {
  const { data: places = [] } = useSmartSeoulThemePlacesQuery();
  const themeProgressItems = createPlaceThemeProgressItems({
    places,
    themes: SMART_SEOUL_PLACE_THEMES,
  });

  return (
    <ExplorationPage
      placeMarkers={createPlacesFeatureCollection(places)}
      themeProgressItems={themeProgressItems}
    />
  );
}
