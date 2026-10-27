import { useCallback, useRef } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type {
  EntryExplorationDartRouletteHighlight,
  EntryExplorationDartRouletteLayout,
  EntryExplorationDartRouletteWin,
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type UseEntryExplorationSceneInteractionControllersOptions = {
  collectedNumbers?: readonly number[];
  onDartEntryBlocked?: () => void;
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onDartTargetHoverChange?: (isOverValidCell: boolean) => void;
  onDartViewActiveChange?: (isActive: boolean) => void;
  onDartViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onRouletteCameraSettled?: () => void;
  onRouletteEntryBlocked?: () => void;
  onRouletteHighlight?: (highlight: EntryExplorationDartRouletteHighlight) => void;
  onRouletteLayoutChange?: (layout: EntryExplorationDartRouletteLayout) => void;
  onRouletteThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onRouletteViewActiveChange?: (isActive: boolean) => void;
  onRouletteViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onRouletteWin?: (win: EntryExplorationDartRouletteWin) => void;
};

type UseEntryExplorationSceneInteractionControllersResult = {
  createSceneInteractionControllers: () => EntryExplorationSceneInteractionController[];
};

export function useEntryExplorationSceneInteractionControllers({
  collectedNumbers = [],
  onDartEntryBlocked,
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDartViewControlsReady,
  onRouletteCameraSettled,
  onRouletteEntryBlocked,
  onRouletteHighlight,
  onRouletteLayoutChange,
  onRouletteThrowResult,
  onRouletteViewActiveChange,
  onRouletteViewControlsReady,
  onRouletteWin,
}: UseEntryExplorationSceneInteractionControllersOptions = {}): UseEntryExplorationSceneInteractionControllersResult {
  const collectedNumbersRef = useRef(collectedNumbers);
  collectedNumbersRef.current = collectedNumbers;
  const onDartEntryBlockedRef = useRef(onDartEntryBlocked);
  onDartEntryBlockedRef.current = onDartEntryBlocked;
  const onRouletteEntryBlockedRef = useRef(onRouletteEntryBlocked);
  onRouletteEntryBlockedRef.current = onRouletteEntryBlocked;
  const getCollectedNumbers = useCallback(() => collectedNumbersRef.current, []);
  const handleDartEntryBlocked = useCallback(() => onDartEntryBlockedRef.current?.(), []);
  const handleRouletteEntryBlocked = useCallback(() => onRouletteEntryBlockedRef.current?.(), []);

  const createSceneInteractionControllers = useCallback(
    () =>
      createEntryExplorationSceneInteractionControllers({
        getCollectedNumbers,
        onDartEntryBlocked: handleDartEntryBlocked,
        onDartTargetHoverChange,
        onDartThrowResult,
        onDartViewActiveChange,
        onDartViewControlsReady,
        onRouletteCameraSettled,
        onRouletteEntryBlocked: handleRouletteEntryBlocked,
        onRouletteHighlight,
        onRouletteLayoutChange,
        onRouletteThrowResult,
        onRouletteViewActiveChange,
        onRouletteViewControlsReady,
        onRouletteWin,
      }),
    [
      getCollectedNumbers,
      handleDartEntryBlocked,
      handleRouletteEntryBlocked,
      onDartTargetHoverChange,
      onDartThrowResult,
      onDartViewActiveChange,
      onDartViewControlsReady,
      onRouletteCameraSettled,
      onRouletteHighlight,
      onRouletteLayoutChange,
      onRouletteThrowResult,
      onRouletteViewActiveChange,
      onRouletteViewControlsReady,
      onRouletteWin,
    ]
  );

  return { createSceneInteractionControllers };
}
