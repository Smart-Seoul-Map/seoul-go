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
import { getSeoulDistrictById } from "@shared/constants/district";
import { PATH, matchDistrictExplorationPath } from "@shared/constants/path";
import type { ComponentType, ReactElement } from "react";
import { useEffect, useState } from "react";

const ROUTE_COMPONENTS: Readonly<Record<string, ComponentType>> = {
  [PATH.ROULETTE]: RouletteSelectionPage,
  [PATH.ROULETTE_WHEEL]: RouletteTest1Page,
  [PATH.ROULETTE_MAP]: RouletteTest2Page,
};

function useAppPathname(): string {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    if (pathname !== PATH.HOME) {
      return;
    }

    window.history.replaceState(null, "", PATH.ROULETTE);
    setPathname(PATH.ROULETTE);
  }, [pathname]);

  return pathname === PATH.HOME ? PATH.ROULETTE : pathname;
}

function ExplorationApp({ districtId }: { districtId?: number }): ReactElement {
  const { data: places = [] } = useSmartSeoulThemePlacesQuery();
  const district = districtId === undefined ? null : getSeoulDistrictById(districtId);
  const themeProgressItems = createPlaceThemeProgressItems({
    places,
    themes: SMART_SEOUL_PLACE_THEMES,
  });

  return (
    <ExplorationPage
      initialCenter={
        district
          ? { lng: district.officePosition.lng, lat: district.officePosition.lat }
          : undefined
      }
      placeMarkers={createPlacesFeatureCollection(places)}
      themeProgressItems={themeProgressItems}
    />
  );
}

export function App(): ReactElement {
  const pathname = useAppPathname();
  const RouteComponent = ROUTE_COMPONENTS[pathname];
  const districtId = matchDistrictExplorationPath(pathname);

  if (RouteComponent) {
    return <RouteComponent />;
  }

  if (pathname === PATH.EXPLORATION || districtId !== null) {
    return <ExplorationApp districtId={districtId ?? undefined} />;
  }

  return <RouletteSelectionPage />;
}
