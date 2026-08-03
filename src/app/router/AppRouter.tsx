import { useCallback, useState } from "react";
import type { ReactElement } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, RouterProvider, createBrowserRouter, useParams } from "react-router-dom";

import { App } from "@app/App";
import { PATH } from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { STATION_EXPLORATION_RADIUS_METERS } from "@shared/constants/stationExploration";

import {
  EntryExplorationPage,
  getLine2StationById,
  type EntryExplorationSubwaySelectionStatus,
  type Line2Station,
  type SubwayStationAvailabilityStatus,
} from "@features/entry-exploration";
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
import {
  SMART_SEOUL_PLACE_THEME_IDS,
  placesQueryKeys,
  useNearbySmartSeoulThemePlacesQuery,
} from "@features/places";

import {
  useDistrictExplorationRoutePlaces,
  useStationExplorationRoutePlaces,
} from "./useExplorationRoutePlaces";

type ExplorationRouteProps = {
  target?: ExplorationTarget | null;
};

function EntryExplorationRoute(): ReactElement {
  const queryClient = useQueryClient();
  const [selectedStation, setSelectedStation] = useState<Line2Station | null>(null);
  const handleSubwayStationSelectionChange = useCallback(
    (
      station: Line2Station | null,
      selectionStatus: EntryExplorationSubwaySelectionStatus
    ): void => {
      if (!station) {
        setSelectedStation(null);
        return;
      }

      if (selectionStatus !== "selecting") {
        return;
      }

      void queryClient.invalidateQueries({
        exact: true,
        queryKey: placesQueryKeys.nearbySmartSeoulThemePlaces({
          center: station.stationGeoPosition,
          distanceMeters: STATION_EXPLORATION_RADIUS_METERS,
          themeIds: SMART_SEOUL_PLACE_THEME_IDS,
        }),
      });
      setSelectedStation(station);
    },
    [queryClient]
  );

  const placesQuery = useNearbySmartSeoulThemePlacesQuery(
    selectedStation
      ? {
          center: selectedStation.stationGeoPosition,
          distanceMeters: STATION_EXPLORATION_RADIUS_METERS,
        }
      : null,
    { staleTimeMs: 0 }
  );
  const availabilityStatus = getSubwayStationAvailabilityStatus({
    hasSelectedStation: selectedStation !== null,
    isError: placesQuery.isError,
    isFetching: placesQuery.isFetching,
    placeCount: placesQuery.data?.length,
  });

  return (
    <EntryExplorationPage
      onSubwayStationSelectionChange={handleSubwayStationSelectionChange}
      subwayStationAvailabilityStatus={availabilityStatus}
    />
  );
}

function getSubwayStationAvailabilityStatus({
  hasSelectedStation,
  isError,
  isFetching,
  placeCount,
}: {
  hasSelectedStation: boolean;
  isError: boolean;
  isFetching: boolean;
  placeCount: number | undefined;
}): SubwayStationAvailabilityStatus {
  if (!hasSelectedStation) {
    return "idle";
  }

  if (isFetching) {
    return "checking";
  }

  if (isError) {
    return "error";
  }

  return placeCount === 0 ? "empty" : "available";
}

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
