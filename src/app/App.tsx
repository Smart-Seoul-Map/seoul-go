import { ExplorationPage } from "@features/exploration";
import { RouletteSelectionPage } from "@features/roulette-selection";
import { RouletteTest1Page } from "@features/roulette-test1";
import { RoulettePage as RouletteTest2Page } from "@features/roulette-test2";
import {
  SMART_SEOUL_PLACE_THEMES,
  createPlacesFeatureCollection,
  createPlaceThemeProgressItems,
  useSmartSeoulThemePlacesQuery,
} from "@features/places";
import { PATH } from "@shared/constants/path";
import type { ComponentType, ReactElement } from "react";

const ROUTE_COMPONENTS: Readonly<Record<string, ComponentType>> = {
  [PATH.ROULETTE]: RouletteSelectionPage,
  [PATH.ROULETTE_TEST1]: RouletteTest1Page,
  [PATH.ROULETTE_TEST2]: RouletteTest2Page,
};

function ExplorationApp(): ReactElement {
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
  const RouteComponent = ROUTE_COMPONENTS[window.location.pathname];

  if (RouteComponent) {
    return <RouteComponent />;
  }

  return <ExplorationApp />;
}
