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
import { EntryExplorationDartRouletteBoard } from "./EntryExplorationDartRouletteBoard";
import { EntryExplorationSceneButton } from "./EntryExplorationSceneButton";
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";
import { useEntryNumberRewardStore } from "../application/useEntryNumberRewardStore";
import {
  getEntryDartNumbers,
  getEntryNumberRewardCells,
  getEntryNumberRewardRows,
} from "../domain/entryNumberReward";
import {
  ENTRY_GRID_NUMBER_REQUIRED_MESSAGE,
  ENTRY_NUMBER_REWARD_TOAST_ACTION_LABEL,
  ENTRY_NUMBER_REWARD_TOAST_MESSAGE,
} from "../config/entryNumberRewardConfig";
import { useEntryCharacterSpeech } from "../application/useEntryCharacterSpeech";
import { ENTRY_CHARACTER_SPEECH_MESSAGES } from "../config/entryCharacterSpeechMessages";
import "./entry-edition-places.css";

export type EntryExplorationPageProps = {
  places: readonly EntryEditionPlace[] | null;
  onIntroBlocked?: () => void;
  renderPlacePanel?: (props: {
    open: boolean;
    onClose: () => void;
    placeId: EntryExplorationPlaceId;
  }) => ReactNode;
};

const EMPTY_ENTRY_PLACES: readonly EntryEditionPlace[] = [];

export function EntryExplorationPage({
  places,
  onIntroBlocked,
  renderPlacePanel,
}: EntryExplorationPageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { showToast, clearToasts } = useAppToast();
  const rewards = useEntryNumberRewardStore((state) => state.rewards);
  const visitPlace = useEntryNumberRewardStore((state) => state.visitPlace);
  const [pendingPlaceIds, setPendingPlaceIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isCharacterMoving, setIsCharacterMoving] = useState(false);
  const {
    hasStarted,
    handleIntroStart,
    handleSceneControlsReady,
    handleDeactivateActiveInteraction,
  } = useEntryExplorationIntro();
  const {
    dartShot,
    onArrowThrow,
    onDartTargetHoverChange,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
    onFlightEnd,
    onRequestRouletteView,
    onRetryThrow,
    onRouletteCameraSettled,
    onRouletteHighlight,
    onRouletteLayoutChange,
    onRouletteStart,
    onRouletteThrowResult,
    onRouletteViewActiveChange,
    onRouletteViewControlsReady,
    onRouletteWin,
    requestDartView,
    rouletteMapRectStore,
  } = useEntryExplorationDartShot();
  const { placeVisits, panelProps, dismissOpenPanel } = useEntryExplorationPlacePanel(
    places ?? EMPTY_ENTRY_PLACES,
    {
      onVisit: (placeId) => {
        const place = places?.find((candidate) => candidate.id === placeId);
        const reward = place ? visitPlace(place) : null;
        track({ name: "entry_place_visit", placeId, rewarded: Boolean(reward) });
        if (reward) setPendingPlaceIds((previous) => new Set(previous).add(placeId));
      },
      onDismiss: (placeId) => {
        if (!pendingPlaceIds.has(placeId)) return;
        setPendingPlaceIds((previous) => {
          const next = new Set(previous);
          next.delete(placeId);
          return next;
        });
        showNumberRewardToast();
      },
    }
  );
  const showNumberRewardToast = (): void => {
    showToast({
      message: ENTRY_NUMBER_REWARD_TOAST_MESSAGE,
      status: "success",
      actionLabel: ENTRY_NUMBER_REWARD_TOAST_ACTION_LABEL,
      onAction: () => {
        dismissOpenPanel();
        clearToasts();
        requestDartView();
      },
    });
  };
  const visibleRewards = rewards.filter((reward) => !pendingPlaceIds.has(reward.placeId));
  const { createSceneInteractionControllers } = useEntryExplorationSceneInteractionControllers({
    collectedNumbers: getEntryDartNumbers(visibleRewards),
    onDartEntryBlocked: () => {
      track({ name: "entry_dart_blocked" });
      showToast({ message: ENTRY_GRID_NUMBER_REQUIRED_MESSAGE });
    },
    onDartTargetHoverChange,
    onDartThrowResult,
    onDartViewActiveChange,
    onDartViewControlsReady,
    onRouletteCameraSettled,
    onRouletteEntryBlocked: () => {
      track({ name: "entry_roulette_blocked" });
      showToast({ message: ENTRY_GRID_NUMBER_REQUIRED_MESSAGE });
    },
    onRouletteHighlight,
    onRouletteLayoutChange,
    onRouletteThrowResult,
    onRouletteViewActiveChange,
    onRouletteViewControlsReady,
    onRouletteWin,
  });
  const characterSpeech = useEntryCharacterSpeech({
    hasStarted,
    isDartActive: dartShot.isGuideVisible,
  });

  useEntryExplorationThreeScene({
    places,
    containerRef,
    createSceneInteractionControllers,
    onSceneControlsReady: handleSceneControlsReady,
    onIntroStart: handleIntroStart,
    onIntroBlocked,
    placeVisits,
    onPlacePanelDismiss: dismissOpenPanel,
    onCharacterMovingChange: (isMoving) => {
      setIsCharacterMoving(isMoving);
      characterSpeech.handleCharacterMovingChange(isMoving);
    },
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

  const isRouletteView = dartShot.isGuideVisible && dartShot.viewKind === "roulette";
  const rouletteVisitedPlaces = getEntryNumberRewardCells(
    visibleRewards,
    dartShot.rouletteBoard.layout?.selectableCells ?? [],
    places ?? EMPTY_ENTRY_PLACES
  );

  return (
    <main className="entry-exploration-page" data-dart-target={dartShot.isTargetHovered}>
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      {isRouletteView && (
        <EntryExplorationDartRouletteBoard
          board={dartShot.rouletteBoard}
          hasResult={dartShot.shotResult !== null}
          isReady={dartShot.isRouletteReady}
          isStarted={dartShot.isRouletteStarted}
          mapRectStore={rouletteMapRectStore}
          onStart={onRouletteStart}
          visitedPlaces={rouletteVisitedPlaces}
        />
      )}
      <EntryExplorationDartGuide
        isVisible={dartShot.isGuideVisible}
        landedResult={dartShot.landedResult}
        viewKind={dartShot.viewKind}
        onClose={handleDeactivateActiveInteraction}
        onRetryThrow={onRetryThrow}
        onStartExploration={handleStartGridExploration}
        shotResult={dartShot.shotResult}
      />
      <EntryExplorationDartArrow
        isTargetHovered={dartShot.isTargetHovered}
        isVisible={dartShot.isGuideVisible && !isRouletteView}
        onFlightEnd={onFlightEnd}
        onThrow={onArrowThrow}
        shot={dartShot.shotResult}
      />
      <EntryExplorationDartHitBadge result={dartShot.landedResult} />
      {hasStarted && (
        <EntryCollectedNumbersPanel
          rows={getEntryNumberRewardRows(visibleRewards)}
          isCharacterMoving={isCharacterMoving}
          isDartViewActive={dartShot.isGuideVisible}
        />
      )}
      <EntryExplorationSceneButton
        isVisible={hasStarted && !dartShot.isGuideVisible}
        onClick={onRequestRouletteView}
        placement="corner"
      >
        시작 지점 뽑기
      </EntryExplorationSceneButton>
      {hasStarted && renderPlacePanel?.(panelProps)}
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
