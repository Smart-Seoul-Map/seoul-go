import { useCallback, useRef } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type { EntryExplorationSeoulTileMapViewInteractionOptions } from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type UseEntryExplorationSceneInteractionControllersOptions = Omit<
  EntryExplorationSeoulTileMapViewInteractionOptions,
  "getCollectedNumbers"
> & {
  collectedNumbers?: readonly number[];
};

type UseEntryExplorationSceneInteractionControllersResult = {
  createSceneInteractionControllers: () => EntryExplorationSceneInteractionController[];
};

export function useEntryExplorationSceneInteractionControllers({
  collectedNumbers = [],
  onActiveChange,
  onCameraSettled,
  onControlsReady,
  onDartThrowResult,
  onEntryBlocked,
  onRouletteHighlight,
  onRouletteLayoutChange,
  onRouletteThrowResult,
  onRouletteWin,
  onTargetHoverChange,
}: UseEntryExplorationSceneInteractionControllersOptions = {}): UseEntryExplorationSceneInteractionControllersResult {
  const collectedNumbersRef = useRef(collectedNumbers);
  collectedNumbersRef.current = collectedNumbers;
  const onEntryBlockedRef = useRef(onEntryBlocked);
  onEntryBlockedRef.current = onEntryBlocked;
  const getCollectedNumbers = useCallback(() => collectedNumbersRef.current, []);
  const handleEntryBlocked = useCallback(() => onEntryBlockedRef.current?.(), []);

  const createSceneInteractionControllers = useCallback(
    () =>
      createEntryExplorationSceneInteractionControllers({
        getCollectedNumbers,
        onActiveChange,
        onCameraSettled,
        onControlsReady,
        onDartThrowResult,
        onEntryBlocked: handleEntryBlocked,
        onRouletteHighlight,
        onRouletteLayoutChange,
        onRouletteThrowResult,
        onRouletteWin,
        onTargetHoverChange,
      }),
    [
      getCollectedNumbers,
      handleEntryBlocked,
      onActiveChange,
      onCameraSettled,
      onControlsReady,
      onDartThrowResult,
      onRouletteHighlight,
      onRouletteLayoutChange,
      onRouletteThrowResult,
      onRouletteWin,
      onTargetHoverChange,
    ]
  );

  return { createSceneInteractionControllers };
}
