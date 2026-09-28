import { useCallback, useEffect, useRef, useState } from "react";
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
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";
import {
  entryNumberRewardStore,
  useEntryNumberRewardStore,
} from "../application/useEntryNumberRewardStore";
import { isEntryNumberRewardPlaceId } from "../config/entryNumberRewardConfig";

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
  const rewards = useEntryNumberRewardStore((state) => state.rewards);
  const visitPlace = useEntryNumberRewardStore((state) => state.visitPlace);
  const revealReward = useEntryNumberRewardStore((state) => state.revealReward);
  const [restoredReward] = useState(() => rewards.find((reward) => !reward.revealed));
  const {
    isReady,
    isVisible,
    handleStart,
    handleSceneControlsReady: handleIntroControlsReady,
  } = useEntryExplorationIntro();
  const { createSubwayInteractionControllers, subwaySelection } =
    useEntryExplorationSubwaySelection();
  const { createSlotInteractionControllers, showReward, ...slot } = useEntrySlot({
    onRewardRevealed: revealReward,
  });
  const { placeVisits, panelProps, dismissOpenPanel } = useEntryExplorationPlacePanel({
    onVisit: visitPlace,
    onDismiss: (placeId) => {
      const reward = entryNumberRewardStore
        .getState()
        .rewards.find((item) => item.placeId === placeId);
      if (reward) showReward(reward);
    },
  });
  useEffect(() => {
    if (!isVisible && restoredReward) showReward(restoredReward);
  }, [isVisible, restoredReward, showReward]);
  const collectedNumbers = rewards
    .filter((reward) => reward.revealed)
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
    onPlacePanelDismiss: dismissOpenPanel,
    resumePlaceId: isEntryNumberRewardPlaceId(restoredReward?.placeId)
      ? restoredReward.placeId
      : undefined,
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
      {!isVisible && slot.state.status === "closed" && (
        <EntryCollectedNumbersPanel numbers={collectedNumbers} />
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
