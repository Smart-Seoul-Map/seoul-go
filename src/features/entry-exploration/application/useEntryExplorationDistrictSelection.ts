import { useCallback, useRef, useState } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export type UseEntryExplorationDistrictSelectionOptions = {
  collectedNumbers?: readonly number[];
  onDartEntryBlocked?: () => void;
  createExtraSceneInteractionControllers?: () => readonly EntryExplorationSceneInteractionController[];
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onDartTargetHoverChange?: (isOverValidCell: boolean) => void;
  onDartViewActiveChange?: (isActive: boolean) => void;
  onDartViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
};

const createNoExtraSceneInteractionControllers =
  (): readonly EntryExplorationSceneInteractionController[] => [];

export function useEntryExplorationDistrictSelection({
  collectedNumbers = [],
  onDartEntryBlocked,
  createExtraSceneInteractionControllers = createNoExtraSceneInteractionControllers,
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDartViewControlsReady,
}: UseEntryExplorationDistrictSelectionOptions = {}) {
  const collectedNumbersRef = useRef(collectedNumbers);
  collectedNumbersRef.current = collectedNumbers;
  const onDartEntryBlockedRef = useRef(onDartEntryBlocked);
  onDartEntryBlockedRef.current = onDartEntryBlocked;
  // Scene controllers outlive renders; read current rewards without rebuilding the scene.
  const getCollectedNumbers = useCallback(() => collectedNumbersRef.current, []);
  const handleDartEntryBlocked = useCallback(() => onDartEntryBlockedRef.current?.(), []);
  const sceneControlsRef = useRef<EntryExplorationThreeSceneControls | null>(null);
  const [selectionResult, setSelectionResult] =
    useState<EntryExplorationDistrictSelectionResult | null>(null);

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
        onDistrictSelectionResult: setSelectionResult,
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

  const handleSceneControlsReady = useCallback(
    (controls: EntryExplorationThreeSceneControls | null) => {
      sceneControlsRef.current = controls;
    },
    []
  );

  const deactivateSelection = useCallback(() => {
    setSelectionResult(null);
    sceneControlsRef.current?.deactivateActiveInteraction();
  }, []);

  const retrySelection = useCallback(() => {
    setSelectionResult(null);
    sceneControlsRef.current?.retryActiveInteraction();
  }, []);

  return {
    createSceneInteractionControllers,
    deactivateSelection,
    handleSceneControlsReady,
    retrySelection,
    selectionResult,
  };
}
