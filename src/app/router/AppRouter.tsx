import type { ReactElement } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { App } from "@app/App";
import { PATH, parseExplorationSpawnCenter } from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";

import { EntryExplorationPage, getLine2StationById } from "@features/entry-exploration";
import {
  ExplorationPage,
  STATION_EXPLORATION_RADIUS_METERS,
  createDistrictExplorationTarget,
  createStationExplorationTarget,
  parseDistrictExplorationTargetIdParam,
  type Coordinates,
  type DistrictExplorationTarget,
  type ExplorationTarget,
  type StationExplorationTarget,
} from "@features/exploration";

import {
  useDistrictExplorationRoutePlaces,
  useStationExplorationRoutePlaces,
} from "./useExplorationRoutePlaces";
import { useAddExplorationPlaceToCourse } from "./useAddExplorationPlaceToCourse";
import { useSubwayStationAvailability } from "./useSubwayStationAvailability";

type ExplorationRouteProps = {
  spawnCenter?: Coordinates | null;
  target?: ExplorationTarget | null;
};

function EntryExplorationRoute(): ReactElement {
  const { availabilityStatus, handleSubwayStationSelectionChange } = useSubwayStationAvailability();

  return (
    <EntryExplorationPage
      onSubwayStationSelectionChange={handleSubwayStationSelectionChange}
      subwayStationAvailabilityStatus={availabilityStatus}
    />
  );
}

function ExplorationRoute({
  spawnCenter = null,
  target = null,
}: ExplorationRouteProps): ReactElement {
  if (!target) {
    return <DefaultExplorationRouteContent />;
  }

  if (target.type === "district") {
    return <DistrictExplorationRouteContent spawnCenter={spawnCenter} target={target} />;
  }

  if (target.type === "station") {
    return <StationExplorationRouteContent target={target} />;
  }

  return <Navigate to={PATH.HOME} replace />;
}

function DefaultExplorationRouteContent(): ReactElement {
  return <DistrictExplorationRouteContent target={null} />;
}

type DistrictExplorationRouteContentProps = {
  spawnCenter?: Coordinates | null;
  target: DistrictExplorationTarget | null;
};

function DistrictExplorationRouteContent({
  spawnCenter = null,
  target,
}: DistrictExplorationRouteContentProps): ReactElement {
  const handleAddPlaceToCourse = useAddExplorationPlaceToCourse();
  const { placeMarkers, themeProgressItems } = useDistrictExplorationRoutePlaces(target);

  return (
    <ExplorationPage
      districtId={target?.districtId}
      districtName={target?.districtName}
      initialCenter={spawnCenter ?? target?.center}
      onAddPlaceToCourse={handleAddPlaceToCourse}
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
  const handleAddPlaceToCourse = useAddExplorationPlaceToCourse();
  const { placeMarkers, themeProgressItems } = useStationExplorationRoutePlaces(target);

  return (
    <ExplorationPage
      initialCenter={target.center}
      onAddPlaceToCourse={handleAddPlaceToCourse}
      placeMarkers={placeMarkers}
      stationRadiusMeters={target.radiusMeters}
      themeProgressItems={themeProgressItems}
    />
  );
}

function DistrictExplorationRoute(): ReactElement {
  const { districtId } = useParams();
  const [searchParams] = useSearchParams();
  const parsedDistrictId = parseDistrictExplorationTargetIdParam(districtId);
  const district = parsedDistrictId ? getSeoulDistrictById(parsedDistrictId) : null;

  if (!district) {
    return <Navigate to={PATH.HOME} replace />;
  }

  return (
    <ExplorationRoute
      key={district.id}
      spawnCenter={parseExplorationSpawnCenter(searchParams)}
      target={createDistrictExplorationTarget(district)}
    />
  );
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
        element: <EntryExplorationRoute />,
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
