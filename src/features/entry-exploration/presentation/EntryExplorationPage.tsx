import { useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { createDistrictExplorationPath } from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { track } from "@shared/lib/analytics/analytics";
import { HAECHI_CHARACTER_NAME } from "@shared/lib/character/haechiCharacterModel";
import { AppSpeechBubble } from "@shared/ui/speech-bubble";
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
import { useEntrySlot } from "../application/useEntrySlot";
import { EntrySlotOverlay } from "./EntrySlotOverlay";
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";
import { useEntryNumberRewardStore } from "../application/useEntryNumberRewardStore";
import type { EntryNumberReward } from "../domain/entryNumberReward";
import { ENTRY_GRID_NUMBER_REQUIRED_MESSAGE } from "../config/entryNumberRewardConfig";
import { useEntryCharacterSpeech } from "../application/useEntryCharacterSpeech";
import { ENTRY_CHARACTER_SPEECH_MESSAGES } from "../config/entryCharacterSpeechMessages";
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
  const {
    hasStarted,
    handleIntroStart,
    handleSceneControlsReady,
    handleDeactivateActiveInteraction,
  } = useEntryExplorationIntro();
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
      track({ name: "entry_place_visit", placeId, rewarded: Boolean(reward) });
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
    onDartEntryBlocked: () => {
      track({ name: "entry_dart_blocked" });
      showToast({ message: ENTRY_GRID_NUMBER_REQUIRED_MESSAGE });
    },
    createExtraSceneInteractionControllers: createSlotInteractionControllers,
    onDartTargetHoverChange,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
  });
  const characterSpeech = useEntryCharacterSpeech({
    hasStarted,
    slotStatus: slot.state.status,
    isDartActive: dartShot.isGuideVisible,
  });

  useEntryExplorationThreeScene({
    places,
    containerRef,
    createSceneInteractionControllers,
    onSceneControlsReady: handleSceneControlsReady,
    onIntroStart: handleIntroStart,
    placeVisits,
    onPlacePanelDismiss: dismissOpenPanel,
    onCharacterMovingChange: characterSpeech.handleCharacterMovingChange,
    characterSpeechAnchor: characterSpeech.anchor,
  });

  const handleStartGridExploration = (result: EntryExplorationDartThrowResult): void => {
    const district = result.districtId ? getSeoulDistrictById(result.districtId) : null;

    if (!district) {
      return;
    }

    track({ name: "entry_district_start", districtId: district.id });
    navigate(createDistrictExplorationPath(district.id, toSeoulGridCellCenter(result.cell)));
  };

  return (
    <main className="entry-exploration-page" data-dart-target={dartShot.isTargetHovered}>
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      <EntryExplorationDartGuide
        isVisible={dartShot.isGuideVisible}
        landedResult={dartShot.landedResult}
        onClose={handleDeactivateActiveInteraction}
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
      {hasStarted && slot.state.status === "closed" && (
        <EntryCollectedNumbersPanel numbers={collectedNumbers} />
      )}
      {hasStarted && renderPlacePanel?.(panelProps)}
      {hasStarted && <EntrySlotOverlay {...slot} />}
      {characterSpeech.speechKey &&
        createPortal(
          <AppSpeechBubble
            speaker={HAECHI_CHARACTER_NAME}
            message={ENTRY_CHARACTER_SPEECH_MESSAGES[characterSpeech.speechKey]}
          />,
          characterSpeech.anchor.element
        )}
    </main>
  );
}
