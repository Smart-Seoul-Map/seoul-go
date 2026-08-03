import type { ReactElement } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useParams } from "react-router-dom";

import { App } from "@app/App";
import {
  ExplorationPage,
  createDistrictExplorationTarget,
  createStationExplorationTarget,
  isDistrictExplorationTarget,
  parseDistrictExplorationTargetIdParam,
  type DistrictExplorationTarget,
  type ExplorationTarget,
  type StationExplorationTarget,
} from "@features/exploration";
import { EntryExplorationPage, getLine2StationById } from "@features/entry-exploration";
import { PATH } from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { STATION_EXPLORATION_RADIUS_METERS } from "@shared/constants/stationExploration";

import {
  useDistrictExplorationRoutePlaces,
  useStationExplorationRoutePlaces,
} from "./useExplorationRoutePlaces";

type ExplorationRouteProps = {
  target?: ExplorationTarget | null;
};

function ExplorationRoute({ target = null }: ExplorationRouteProps): ReactElement {
  if (target?.type === "station") {
    return <StationExplorationRouteContent target={target} />;
  }

  const districtTarget = isDistrictExplorationTarget(target) ? target : null;

  return <DistrictExplorationRouteContent target={districtTarget} />;
}

type DistrictExplorationRouteContentProps = {
  target: DistrictExplorationTarget | null;
};

function DistrictExplorationRouteContent({
  target,
}: DistrictExplorationRouteContentProps): ReactElement {
  const { placeMarkers, themeProgressItems } = useDistrictExplorationRoutePlaces(target);

  return (
    <ExplorationPage
      districtId={target?.districtId}
      districtName={target?.districtName}
      initialCenter={target?.center}
      placeMarkers={placeMarkers}
      themeProgressItems={themeProgressItems}
    />
  );
}

type StationExplorationRouteContentProps = {
  target: StationExplorationTarget;
};

function StationExplorationRouteContent({
  target,
}: StationExplorationRouteContentProps): ReactElement {
  const { placeMarkers, themeProgressItems } = useStationExplorationRoutePlaces(target);

  return (
    <ExplorationPage
      initialCenter={target.center}
      placeMarkers={placeMarkers}
      stationRadiusMeters={target.radiusMeters}
      themeProgressItems={themeProgressItems}
    />
  );
}

function DistrictExplorationRoute(): ReactElement {
  const { districtId } = useParams();
  const parsedDistrictId = parseDistrictExplorationTargetIdParam(districtId);
  const district = parsedDistrictId ? getSeoulDistrictById(parsedDistrictId) : null;

  if (!district) {
    return <Navigate to={PATH.HOME} replace />;
  }

  return <ExplorationRoute key={district.id} target={createDistrictExplorationTarget(district)} />;
}

function SubwayStationExplorationRoute(): ReactElement {
  const { stationId } = useParams();
  const station = stationId ? getLine2StationById(stationId) : null;

  if (!station) {
    return <Navigate to={PATH.HOME} replace />;
  }

  return (
    <ExplorationRoute
      key={station.id}
      target={createStationExplorationTarget({
        center: station.stationGeoPosition,
        radiusMeters: STATION_EXPLORATION_RADIUS_METERS,
        stationId: station.id,
        stationName: station.name,
      })}
    />
  );
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
