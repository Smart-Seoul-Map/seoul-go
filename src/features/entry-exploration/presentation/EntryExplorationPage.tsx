import { useCallback, useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  createDistrictExplorationPath,
  createSubwayStationExplorationPath,
} from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";

import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";
import type { SubwayStationAvailabilityStatus } from "../application/subwayStationAvailability";
import type { EntryExplorationSubwaySelectionStatus } from "../application/entryExplorationSubwaySelectionInteraction";
import { useEntryExplorationDartShot } from "../application/useEntryExplorationDartShot";
import { useEntryExplorationDistrictSelection } from "../application/useEntryExplorationDistrictSelection";
import { useEntryExplorationSubwaySelection } from "../application/useEntryExplorationSubwaySelection";
import {
  type EntryExplorationThreeSceneControls,
  useEntryExplorationThreeScene,
} from "../application/useEntryExplorationThreeScene";
import type { Line2Station } from "../domain/line2Station";
import type { EntryExplorationPlaceId } from "../config/entryExplorationPlace";
import { useEntryExplorationIntro } from "../application/useEntryExplorationIntro";
import { useEntryExplorationPlacePanel } from "../application/useEntryExplorationPlacePanel";
import { toSeoulGridCellCenter } from "../domain/seoulGridCoordinates";
import { EntryExplorationDartArrow } from "./EntryExplorationDartArrow";
import { EntryExplorationDartGuide } from "./EntryExplorationDartGuide";
import { EntryExplorationDartHitBadge } from "./EntryExplorationDartHitBadge";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";
import { SubwaySelectionDialog } from "./SubwaySelectionDialog";
import { EntryExplorationIntroOverlay } from "./EntryExplorationIntroOverlay";
import { useEntrySlot } from "../application/useEntrySlot";
import { EntrySlotOverlay } from "./EntrySlotOverlay";

export type EntryExplorationPageProps = {
  renderPlacePanel?: (props: {
    open: boolean;
    onClose: () => void;
    placeId: EntryExplorationPlaceId;
  }) => ReactNode;
  onSubwayStationSelectionChange?: (
    station: Line2Station | null,
    status: EntryExplorationSubwaySelectionStatus
  ) => void;
  subwayStationAvailabilityStatus: SubwayStationAvailabilityStatus;
};

export function EntryExplorationPage({
  renderPlacePanel,
  onSubwayStationSelectionChange,
  subwayStationAvailabilityStatus,
}: EntryExplorationPageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const {
    isReady,
    isVisible,
    handleStart,
    handleSceneControlsReady: handleIntroControlsReady,
  } = useEntryExplorationIntro();
  const { placeVisits, panelProps } = useEntryExplorationPlacePanel();
  const { createSubwayInteractionControllers, subwaySelection } =
    useEntryExplorationSubwaySelection();
  const { createSlotInteractionControllers, ...slot } = useEntrySlot();
  const createExtraSceneInteractionControllers = useCallback(
    () => [...createSubwayInteractionControllers(), ...createSlotInteractionControllers()],
    [createSubwayInteractionControllers, createSlotInteractionControllers]
  );
  const {
    dartShot,
    onArrowThrow,
    onDartTargetHoverChange,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
    onFlightEnd,
    onRetryThrow,
  } = useEntryExplorationDartShot();
  const districtSelection = useEntryExplorationDistrictSelection({
    createExtraSceneInteractionControllers,
    onDartTargetHoverChange,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
  });

  const handleSceneControlsReady = useCallback(
    (controls: EntryExplorationThreeSceneControls | null) => {
      districtSelection.handleSceneControlsReady(controls);
      handleIntroControlsReady(controls);
    },
    [districtSelection, handleIntroControlsReady]
  );

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: handleSceneControlsReady,
    placeVisits,
  });

  useEffect(() => {
    onSubwayStationSelectionChange?.(subwaySelection.selectedStation, subwaySelection.status);
  }, [onSubwayStationSelectionChange, subwaySelection.selectedStation, subwaySelection.status]);

  const handleStartGridExploration = (result: EntryExplorationDartThrowResult): void => {
    const district = result.districtId ? getSeoulDistrictById(result.districtId) : null;

    if (!district) {
      return;
    }

    navigate(createDistrictExplorationPath(district.id, toSeoulGridCellCenter(result.cell)));
  };

  const handleExploreDistrict = (districtId: number): void => {
    navigate(createDistrictExplorationPath(districtId));
  };

  const handleExploreSubwayStation = (stationId: string): void => {
    navigate(createSubwayStationExplorationPath(stationId));
  };

  return (
    <main className="entry-exploration-page" data-dart-target={dartShot.isTargetHovered}>
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      {isVisible ? (
        <EntryExplorationIntroOverlay disabled={!isReady} onStart={handleStart} />
      ) : null}
      <EntryExplorationDartGuide
        isVisible={dartShot.isGuideVisible}
        landedResult={dartShot.landedResult}
        onRetryThrow={onRetryThrow}
        onStartExploration={handleStartGridExploration}
        shotResult={dartShot.shotResult}
      />
      <EntryExplorationDartArrow
        isTargetHovered={dartShot.isTargetHovered}
        isVisible={dartShot.isGuideVisible}
        onFlightEnd={onFlightEnd}
        onThrow={onArrowThrow}
        shot={dartShot.shotResult}
      />
      <EntryExplorationDartHitBadge result={dartShot.landedResult} />
      {!isVisible && renderPlacePanel?.(panelProps)}
      {!isVisible && <EntrySlotOverlay {...slot} />}
      <SubwaySelectionDialog
        availabilityStatus={subwayStationAvailabilityStatus}
        onExplore={handleExploreSubwayStation}
        subwaySelection={subwaySelection}
      />
      <EntryExplorationDistrictSelectionDialog
        onBack={districtSelection.deactivateSelection}
        onExplore={handleExploreDistrict}
        onRetry={districtSelection.retrySelection}
        selectionResult={districtSelection.selectionResult}
      />
    </main>
  );
}
