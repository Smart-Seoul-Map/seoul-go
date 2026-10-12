import { useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { createDistrictExplorationPath } from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { useAppToast } from "@shared/ui/toast";

import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { useEntryExplorationDartShot } from "../application/useEntryExplorationDartShot";
import { useEntryExplorationSceneInteractionControllers } from "../application/useEntryExplorationSceneInteractionControllers";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";
import type { EntryEditionPlace, EntryExplorationPlaceId } from "../domain/entryEditionPlace";
import { useEntryExplorationIntro } from "../application/useEntryExplorationIntro";
import { useEntryExplorationPlacePanel } from "../application/useEntryExplorationPlacePanel";
import { toSeoulGridCellCenter } from "../domain/seoulGridCoordinates";
import { EntryExplorationDartArrow } from "./EntryExplorationDartArrow";
import { EntryExplorationDartGuide } from "./EntryExplorationDartGuide";
import { EntryExplorationDartHitBadge } from "./EntryExplorationDartHitBadge";
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
};

export function EntryExplorationPage({
  places,
  renderPlacePanel,
}: EntryExplorationPageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const rewards = useEntryNumberRewardStore((state) => state.rewards);
  const visitPlace = useEntryNumberRewardStore((state) => state.visitPlace);
  const [pendingRewards, setPendingRewards] = useState(() => new Map<string, EntryNumberReward>());
  const { isReady, isVisible, handleStart, handleSceneControlsReady } = useEntryExplorationIntro();
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
  const { createSceneInteractionControllers } = useEntryExplorationSceneInteractionControllers({
    collectedNumbers,
    onDartEntryBlocked: () => showToast({ message: ENTRY_GRID_NUMBER_REQUIRED_MESSAGE }),
    createExtraSceneInteractionControllers: createSlotInteractionControllers,
    onDartTargetHoverChange,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
  });

  useEntryExplorationThreeScene({
    places,
    containerRef,
    createSceneInteractionControllers,
    onSceneControlsReady: handleSceneControlsReady,
    placeVisits,
    onPlacePanelDismiss: dismissOpenPanel,
  });

  const handleStartGridExploration = (result: EntryExplorationDartThrowResult): void => {
    const district = result.districtId ? getSeoulDistrictById(result.districtId) : null;

    if (!district) {
      return;
    }

    navigate(createDistrictExplorationPath(district.id, toSeoulGridCellCenter(result.cell)));
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
        <EntryCollectedNumbersPanel
          numbers={collectedNumbers}
          shouldOpen={dartShot.isGuideVisible}
        />
      )}
      {!isVisible && renderPlacePanel?.(panelProps)}
      {!isVisible && <EntrySlotOverlay {...slot} />}
    </main>
  );
}
