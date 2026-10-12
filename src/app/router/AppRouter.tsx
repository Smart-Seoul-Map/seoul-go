import { useMemo, type ReactElement } from "react";
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

import { StampCoursePanel, StampCourseSummary } from "@features/course";
import {
  ExplorationPage,
  LinkedPlacesPanel,
  createDistrictExplorationTarget,
  parseDistrictExplorationTargetIdParam,
  type DistrictExplorationTarget,
  type ExplorationPlacePanelProps as ExplorationPlacePanelRenderProps,
  type ExplorationPanelLifecycleProps,
} from "@features/exploration";

import { useDistrictExplorationRoutePlaces } from "./useExplorationRoutePlaces";
import { useAddExplorationPlaceToCourse } from "./useAddExplorationPlaceToCourse";
import { EntryExplorationRoute } from "./EntryExplorationRoute";
import { ExplorationPlacePanel } from "./ExplorationPlacePanel";
import { useLinkedPlaceExploration } from "./useLinkedPlaceExploration";
import { ExplorationMapNotice } from "./ExplorationMapNotice";

const explorationPageSlots = {
  renderMapFooter: (onOpenCourse: () => void) => <StampCourseSummary onOpen={onOpenCourse} />,
  renderCoursePanel: (props: ExplorationPanelLifecycleProps) => <StampCoursePanel {...props} />,
  renderPlacePanel: (props: ExplorationPlacePanelRenderProps) => (
    <ExplorationPlacePanel key={props.place.id} {...props} />
  ),
};

type ExplorationRouteProps = {
  target?: DistrictExplorationTarget | null;
};

function ExplorationRoute({ target = null }: ExplorationRouteProps): ReactElement {
  return <DistrictExplorationRouteContent target={target} />;
}

type DistrictExplorationRouteContentProps = {
  target: DistrictExplorationTarget | null;
};

function DistrictExplorationRouteContent({
  target,
}: DistrictExplorationRouteContentProps): ReactElement {
  const [searchParams] = useSearchParams();
  const initialCenter = useMemo(
    () => parseExplorationSpawnCenter(searchParams) ?? target?.center,
    [searchParams, target?.center]
  );
  const handleAddPlaceToCourse = useAddExplorationPlaceToCourse();
  const { placeMarkers, themeProgressItems, places, isSuccess } =
    useDistrictExplorationRoutePlaces(target);
  const linked = useLinkedPlaceExploration(places);

  return (
    <ExplorationPage
      districtId={target?.districtId}
      {...explorationPageSlots}
      districtName={target?.districtName}
      initialCenter={initialCenter}
      onAddPlaceToCourse={handleAddPlaceToCourse}
      placeMarkers={placeMarkers}
      placeMarkerPresentation="image-year"
      linkedPlaceMarkers={linked.markers}
      hasLinkedPlaceReference={linked.selected !== null}
      onActivateLinkedPlaces={linked.activate}
      mapNotice={
        <ExplorationMapNotice initialPlacesReady={isSuccess && places.length > 0} linked={linked} />
      }
      renderLinkedPlacesPanel={(lifecycle) => (
        <LinkedPlacesPanel
          {...lifecycle}
          references={linked.references}
          selected={linked.selected}
          places={linked.places}
          isLoading={linked.isLoading}
          isError={linked.isError}
          onSelect={linked.select}
          onRetry={linked.retry}
        />
      )}
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
