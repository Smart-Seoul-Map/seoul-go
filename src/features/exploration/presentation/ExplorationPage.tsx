import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

import "./ExplorationPage.css";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { useAppToast } from "@shared/ui/toast";

import type { ExplorationPlaceMarkerSelection } from "../application/explorationPlaceMarkers";
import { createRevealedPlaceMarkers } from "../application/explorationPlaceMarkerReveal";
import {
  createStampCourseToastMessage,
  type AddExplorationPlaceToCourseResultStatus,
} from "../application/explorationStampCourse";
import {
  applyVisitedPlaceCountsToThemeProgressItems,
  type ExplorationThemePlaceVisitProgressItem,
} from "../application/explorationThemePlaceVisitProgress";
import { useVisitedPlaceStore } from "../application/useVisitedPlaceStore";
import type { Coordinates } from "../domain/explorationGeo";
import { ExplorationDistrictStatusBadge } from "./ExplorationDistrictStatusBadge";
import { ExplorationMap } from "./ExplorationMap";
import { ExplorationPlaceCard } from "./ExplorationPlaceCard";
import { ExplorationThemePlaceCountBadge } from "./ExplorationThemePlaceCountBadge";
import { useExplorationPanel } from "./useExplorationPanel";

export type ExplorationPanelLifecycleProps = {
  open?: boolean;
  onExitComplete?: () => void;
  returnFocus?: () => HTMLElement | null;
  onClose: () => void;
};

export type ExplorationPlacePanelProps = ExplorationPanelLifecycleProps & {
  place: ExplorationPlaceMarkerSelection;
  onOpenCourse?: () => void;
  onAddToCourse?: (place: ExplorationPlaceMarkerSelection) => void;
};

type ExplorationPageProps = {
  mapFooter?: ReactNode;
  renderMapFooter?: (onOpenCourse: () => void) => ReactNode;
  renderCoursePanel?: (props: ExplorationPanelLifecycleProps) => ReactNode;
  renderPlacePanel?: (props: ExplorationPlacePanelProps) => ReactNode;
  districtId?: number;
  districtName?: string;
  initialCenter?: Coordinates;
  onAddPlaceToCourse?: (
    place: ExplorationPlaceMarkerSelection
  ) => AddExplorationPlaceToCourseResultStatus;
  placeMarkers?: MapMarkerFeatureCollection;
  stationRadiusMeters?: number;
  themeProgressItems: readonly ExplorationThemePlaceVisitProgressItem[];
};

export function ExplorationPage({
  mapFooter,
  renderMapFooter,
  renderCoursePanel,
  renderPlacePanel,
  districtId,
  districtName,
  initialCenter,
  onAddPlaceToCourse,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  stationRadiusMeters,
  themeProgressItems,
}: ExplorationPageProps): ReactElement {
  const { showToast } = useAppToast();
  const { state: panel, openPanel, closePanel, finishExit } = useExplorationPanel();
  const mapStageRef = useRef<HTMLElement | null>(null);
  const content = panel.status === "closed" ? null : panel.content;
  const selectedPlace = content?.type === "place" ? content.place : null;
  const isCoursePanelOpen = content?.type === "course";
  const isPanelOpen = panel.status === "open";
  const isSwitching = panel.status === "closing" && panel.next !== null;
  useEffect(() => {
    if (panel.status === "closing" && content?.type === "place" && !renderPlacePanel) finishExit();
  }, [panel.status, content?.type, renderPlacePanel, finishExit]);
  const visitedPlaceIds = useVisitedPlaceStore((state) => state.placeIds);
  const visitPlace = useVisitedPlaceStore((state) => state.visitPlace);
  const revealedPlaceIds = useMemo(() => new Set(visitedPlaceIds), [visitedPlaceIds]);

  const selectPlace = useCallback(
    (place: ExplorationPlaceMarkerSelection) => {
      visitPlace(place.id);
      openPanel({ type: "place", place });
    },
    [visitPlace, openPanel]
  );

  const openCoursePanel = () => {
    if (!renderCoursePanel) return;
    openPanel({ type: "course" });
  };
  const returnFocus = () => {
    if (isSwitching) return null;
    const stage = mapStageRef.current;
    if (isCoursePanelOpen) {
      return stage?.querySelector<HTMLElement>(".exploration-map-footer button") ?? stage;
    }
    return stage?.querySelector<HTMLElement>(".maplibregl-canvas") ?? stage;
  };
  const lifecycle = {
    open: isPanelOpen,
    onClose: closePanel,
    onExitComplete: finishExit,
    returnFocus,
  };

  const displayedPlaceMarkers = useMemo(
    () => createRevealedPlaceMarkers({ placeMarkers, revealedPlaceIds }),
    [placeMarkers, revealedPlaceIds]
  );
  const displayedThemeProgressItems = useMemo(
    () =>
      applyVisitedPlaceCountsToThemeProgressItems({
        placeMarkers,
        themeProgressItems,
        visitedPlaceIds: revealedPlaceIds,
      }),
    [placeMarkers, revealedPlaceIds, themeProgressItems]
  );
  const handleAddPlaceToCourse = useCallback(
    (place: ExplorationPlaceMarkerSelection) => {
      if (!onAddPlaceToCourse) {
        return;
      }

      const resultStatus = onAddPlaceToCourse(place);
      showToast(createStampCourseToastMessage(resultStatus));
    },
    [onAddPlaceToCourse, showToast]
  );

  return (
    <main className="exploration-page" aria-label="서울 지도 탐색">
      <section className="map-stage" aria-label="서울 지도" ref={mapStageRef} tabIndex={-1}>
        <ExplorationMap
          districtId={districtId}
          hasActivePanel={isPanelOpen || isSwitching}
          initialCenter={initialCenter}
          onMapMoveRequest={closePanel}
          onPlaceMarkerSelect={selectPlace}
          placeMarkers={displayedPlaceMarkers}
          revealedPlaceIds={revealedPlaceIds}
          stationRadiusMeters={stationRadiusMeters}
        />
        {districtName ? (
          <div className="exploration-district-status">
            <ExplorationDistrictStatusBadge districtName={districtName} />
          </div>
        ) : null}
        <ul className="exploration-theme-place-count-list" aria-label="테마별 장소 개수">
          {displayedThemeProgressItems.map((item) => (
            <li key={item.id} className="exploration-theme-place-count-item">
              <ExplorationThemePlaceCountBadge
                markerColor={item.markerColor}
                markerColorToken={item.markerColorToken}
                name={item.name}
                totalCount={item.totalCount}
                visitedCount={item.visitedCount}
              />
            </li>
          ))}
        </ul>
        {(renderMapFooter || mapFooter) && (
          <div
            className="exploration-map-footer"
            hidden={isCoursePanelOpen && (isPanelOpen || isSwitching)}
          >
            {renderMapFooter ? renderMapFooter(openCoursePanel) : mapFooter}
          </div>
        )}
        <Fragment key={content?.instance}>
          {isCoursePanelOpen && renderCoursePanel?.(lifecycle)}
          {selectedPlace &&
            renderPlacePanel?.({
              ...lifecycle,
              place: selectedPlace,
              onAddToCourse: onAddPlaceToCourse ? handleAddPlaceToCourse : undefined,
              onOpenCourse: renderCoursePanel ? openCoursePanel : undefined,
            })}
          {selectedPlace && isPanelOpen && !renderPlacePanel && (
            <div className="exploration-place-card-layer">
              <ExplorationPlaceCard onAddToCourse={handleAddPlaceToCourse} place={selectedPlace} />
            </div>
          )}
        </Fragment>
      </section>
    </main>
  );
}
