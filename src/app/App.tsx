import { ExplorationPage } from "@features/exploration";
import { EntryExplorationPage } from "@features/entry-exploration";
import {
  SMART_SEOUL_PLACE_THEMES,
  createPlacesFeatureCollection,
  createPlaceThemeProgressItems,
  useSmartSeoulThemePlacesQuery,
} from "@features/places";
import { PATH } from "@shared/constants/path";
import type { ReactElement } from "react";

function ExplorationRoute(): ReactElement {
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

export function App(): ReactElement {
  if (window.location.pathname === PATH.EXPLORATION) {
    return <ExplorationRoute />;
  }

  return <EntryExplorationPage />;
}
