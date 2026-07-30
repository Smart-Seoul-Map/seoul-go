import { useMemo, type ReactElement } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useParams } from "react-router-dom";

import { App } from "@app/App";
import { ExplorationPage, type Coordinates } from "@features/exploration";
import { EntryExplorationPage, getLine2StationById } from "@features/entry-exploration";
import {
  SMART_SEOUL_PLACE_THEMES,
  createPlacesFeatureCollection,
  createPlaceThemeProgressItems,
  filterSmartSeoulPlacesByDistrict,
  useSmartSeoulThemePlacesQuery,
} from "@features/places";
import { PATH } from "@shared/constants/path";
import { getSeoulDistrictById, type SeoulDistrict } from "@shared/constants/seoulDistrict";

type ExplorationRouteProps = {
  district?: SeoulDistrict;
  initialCenter?: Coordinates;
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

function ExplorationRoute({ district, initialCenter }: ExplorationRouteProps): ReactElement {
  const { data: allPlaces = [] } = useSmartSeoulThemePlacesQuery();
  const explorationInitialCenter = district?.officePosition ?? initialCenter;
  const places = useMemo(
    () => filterSmartSeoulPlacesByDistrict(allPlaces, district?.name),
    [allPlaces, district?.name]
  );
  const placeMarkers = useMemo(() => createPlacesFeatureCollection(places), [places]);
  const themeProgressItems = useMemo(
    () =>
      createPlaceThemeProgressItems({
        places,
        themes: SMART_SEOUL_PLACE_THEMES,
      }),
    [places]
  );

  return (
    <ExplorationPage
      districtId={district?.id}
      districtName={district?.name}
      initialCenter={explorationInitialCenter}
      placeMarkers={placeMarkers}
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

function SubwayStationExplorationRoute(): ReactElement {
  const { stationId } = useParams();
  const station = stationId ? getLine2StationById(stationId) : null;

  if (!station) {
    return <Navigate to={PATH.HOME} replace />;
  }

  return <ExplorationRoute key={station.id} initialCenter={station.stationGeoPosition} />;
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
        path: PATH.SUBWAY_STATION_EXPLORATION,
        element: <SubwayStationExplorationRoute />,
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
