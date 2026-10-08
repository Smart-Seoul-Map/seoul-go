import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  createDistrictExplorationPath,
  createSubwayStationExplorationPath,
} from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { useAppToast } from "@shared/ui/toast";

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
import type { EntryEditionPlace, EntryExplorationPlaceId } from "../domain/entryEditionPlace";
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
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";
import { useEntryNumberRewardStore } from "../application/useEntryNumberRewardStore";
import type { EntryNumberReward } from "../domain/entryNumberReward";
import { ENTRY_GRID_NUMBER_REQUIRED_MESSAGE } from "../config/entryNumberRewardConfig";
import "./entry-edition-places.css";

export type EntryExplorationPageProps = {
  places: readonly EntryEditionPlace[];
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
  places,
  renderPlacePanel,
  onSubwayStationSelectionChange,
  subwayStationAvailabilityStatus,
}: EntryExplorationPageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const rewards = useEntryNumberRewardStore((state) => state.rewards);
  const visitPlace = useEntryNumberRewardStore((state) => state.visitPlace);
  const [pendingRewards, setPendingRewards] = useState(() => new Map<string, EntryNumberReward>());
  const {
    isReady,
    isVisible,
    handleStart,
    handleSceneControlsReady: handleIntroControlsReady,
  } = useEntryExplorationIntro();
  const { createSubwayInteractionControllers, subwaySelection } =
    useEntryExplorationSubwaySelection();
  const { createSlotInteractionControllers, showReward, ...slot } = useEntrySlot((placeId) => {
    setPendingRewards((previous) => {
      if (!previous.has(placeId)) return previous;
      const next = new Map(previous);
      next.delete(placeId);
      return next;
    });
  });
  const { placeVisits, panelProps, dismissOpenPanel } = useEntryExplorationPlacePanel(places, {
    onVisit: (placeId) => {
      const reward = visitPlace(placeId);
      if (reward) setPendingRewards((previous) => new Map(previous).set(placeId, reward));
    },
    onDismiss: (placeId) => {
      const reward = pendingRewards.get(placeId);
      if (!reward) return;
      showReward(reward);
    },
  });
  const collectedNumbers = rewards
    .filter((reward) => !pendingRewards.has(reward.placeId))
    .map((reward) => reward.number);
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
    collectedNumbers,
    onDartEntryBlocked: () => showToast({ message: ENTRY_GRID_NUMBER_REQUIRED_MESSAGE }),
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
    places,
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: handleSceneControlsReady,
    placeVisits,
    onPlacePanelDismiss: dismissOpenPanel,
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
        onClose={districtSelection.deactivateSelection}
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
      {!isVisible && slot.state.status === "closed" && (
        <EntryCollectedNumbersPanel
          numbers={collectedNumbers}
          shouldOpen={dartShot.isGuideVisible}
        />
      )}
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
