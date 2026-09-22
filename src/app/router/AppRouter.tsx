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

import { getLine2StationById } from "@features/entry-exploration";
import { StampCoursePanel, StampCourseSummary } from "@features/course";
import {
  ExplorationPage,
  STATION_EXPLORATION_RADIUS_METERS,
  createDistrictExplorationTarget,
  createStationExplorationTarget,
  parseDistrictExplorationTargetIdParam,
  type DistrictExplorationTarget,
  type ExplorationPlacePanelProps as ExplorationPlacePanelRenderProps,
  type ExplorationPanelLifecycleProps,
  type ExplorationTarget,
  type StationExplorationTarget,
} from "@features/exploration";

import {
  useDistrictExplorationRoutePlaces,
  useStationExplorationRoutePlaces,
} from "./useExplorationRoutePlaces";
import { useAddExplorationPlaceToCourse } from "./useAddExplorationPlaceToCourse";
import { EntryExplorationRoute } from "./EntryExplorationRoute";
import { ExplorationPlacePanel } from "./ExplorationPlacePanel";

const explorationPageSlots = {
  renderMapFooter: (onOpenCourse: () => void) => <StampCourseSummary onOpen={onOpenCourse} />,
  renderCoursePanel: (props: ExplorationPanelLifecycleProps) => <StampCoursePanel {...props} />,
  renderPlacePanel: (props: ExplorationPlacePanelRenderProps) => (
    <ExplorationPlacePanel key={props.place.id} {...props} />
  ),
};

type ExplorationRouteProps = {
  target?: ExplorationTarget | null;
};

function ExplorationRoute({ target = null }: ExplorationRouteProps): ReactElement {
  if (!target) {
    return <DefaultExplorationRouteContent />;
  }

  if (target.type === "district") {
    return <DistrictExplorationRouteContent target={target} />;
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
  target: DistrictExplorationTarget | null;
};

function DistrictExplorationRouteContent({
  target,
}: DistrictExplorationRouteContentProps): ReactElement {
  const [searchParams] = useSearchParams();
  const handleAddPlaceToCourse = useAddExplorationPlaceToCourse();
  const { placeMarkers, themeProgressItems, selectionYearLabel } =
    useDistrictExplorationRoutePlaces(target);

  return (
    <ExplorationPage
      districtId={target?.districtId}
      {...explorationPageSlots}
      districtName={target?.districtName}
      initialCenter={parseExplorationSpawnCenter(searchParams) ?? target?.center}
      onAddPlaceToCourse={handleAddPlaceToCourse}
      placeMarkers={placeMarkers}
      selectionYearLabel={selectionYearLabel}
      placeMarkerPresentation="image-year"
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
  const { placeMarkers, themeProgressItems, selectionYearLabel } =
    useStationExplorationRoutePlaces(target);

  return (
    <ExplorationPage
      initialCenter={target.center}
      {...explorationPageSlots}
      onAddPlaceToCourse={handleAddPlaceToCourse}
      placeMarkers={placeMarkers}
      selectionYearLabel={selectionYearLabel}
      placeMarkerPresentation="image-year"
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
