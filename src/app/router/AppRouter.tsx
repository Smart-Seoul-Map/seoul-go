import type { ReactElement } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useParams } from "react-router-dom";

import { App } from "@app/App";
import { ExplorationPage } from "@features/exploration";
import { EntryExplorationPage } from "@features/entry-exploration";
import {
  SMART_SEOUL_PLACE_THEMES,
  createPlacesFeatureCollection,
  createPlaceThemeProgressItems,
  useSmartSeoulThemePlacesQuery,
} from "@features/places";
import { PATH } from "@shared/constants/path";
import { getSeoulDistrictById, type SeoulDistrict } from "@shared/constants/seoulDistrict";

type ExplorationRouteProps = {
  district?: SeoulDistrict;
};

function parseDistrictIdParam(districtId: string | undefined): number | null {
  if (!districtId) {
    return null;
  }

  const parsedDistrictId = Number(districtId);

  if (!Number.isInteger(parsedDistrictId)) {
    return null;
  }

  return parsedDistrictId;
}

function ExplorationRoute({ district }: ExplorationRouteProps): ReactElement {
  const { data: places = [] } = useSmartSeoulThemePlacesQuery(district?.name);
  const themeProgressItems = createPlaceThemeProgressItems({
    places,
    themes: SMART_SEOUL_PLACE_THEMES,
  });

  return (
    <ExplorationPage
      initialCenter={district?.officePosition}
      placeMarkers={createPlacesFeatureCollection(places)}
      themeProgressItems={themeProgressItems}
    />
  );
}

function DistrictExplorationRoute(): ReactElement {
  const { districtId } = useParams();
  const parsedDistrictId = parseDistrictIdParam(districtId);
  const district = parsedDistrictId ? getSeoulDistrictById(parsedDistrictId) : null;

  if (!district) {
    return <Navigate to={PATH.HOME} replace />;
  }

  return <ExplorationRoute key={district.id} district={district} />;
}

const appRouter = createBrowserRouter([
  {
    path: PATH.HOME,
    element: <App />,
    children: [
      {
        index: true,
        element: <EntryExplorationPage />,
      },
      {
        path: PATH.DISTRICT_EXPLORATION,
        element: <DistrictExplorationRoute />,
      },
      {
        path: PATH.EXPLORATION,
        element: <ExplorationRoute />,
      },
      {
        path: "*",
        element: <Navigate to={PATH.HOME} replace />,
      },
    ],
  },
]);

export function AppRouter(): ReactElement {
  return <RouterProvider router={appRouter} />;
}
