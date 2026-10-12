import { useCallback, useRef } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type UseEntryExplorationSceneInteractionControllersOptions = {
  collectedNumbers?: readonly number[];
  onDartEntryBlocked?: () => void;
  createExtraSceneInteractionControllers?: () => readonly EntryExplorationSceneInteractionController[];
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onDartTargetHoverChange?: (isOverValidCell: boolean) => void;
  onDartViewActiveChange?: (isActive: boolean) => void;
  onDartViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
};

type UseEntryExplorationSceneInteractionControllersResult = {
  createSceneInteractionControllers: () => EntryExplorationSceneInteractionController[];
};

const createNoExtraSceneInteractionControllers =
  (): readonly EntryExplorationSceneInteractionController[] => [];

export function useEntryExplorationSceneInteractionControllers({
  collectedNumbers = [],
  onDartEntryBlocked,
  createExtraSceneInteractionControllers = createNoExtraSceneInteractionControllers,
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDartViewControlsReady,
}: UseEntryExplorationSceneInteractionControllersOptions = {}): UseEntryExplorationSceneInteractionControllersResult {
  const collectedNumbersRef = useRef(collectedNumbers);
  collectedNumbersRef.current = collectedNumbers;
  const onDartEntryBlockedRef = useRef(onDartEntryBlocked);
  onDartEntryBlockedRef.current = onDartEntryBlocked;
  const getCollectedNumbers = useCallback(() => collectedNumbersRef.current, []);
  const handleDartEntryBlocked = useCallback(() => onDartEntryBlockedRef.current?.(), []);

  const createSceneInteractionControllers = useCallback(
    () =>
      createEntryExplorationSceneInteractionControllers({
        getCollectedNumbers,
        onDartEntryBlocked: handleDartEntryBlocked,
        extraControllers: createExtraSceneInteractionControllers(),
        onDartTargetHoverChange,
        onDartThrowResult,
        onDartViewActiveChange,
        onDartViewControlsReady,
      }),
    [
      getCollectedNumbers,
      handleDartEntryBlocked,
      createExtraSceneInteractionControllers,
      onDartTargetHoverChange,
      onDartThrowResult,
      onDartViewActiveChange,
      onDartViewControlsReady,
    ]
  );

  return { createSceneInteractionControllers };
}
