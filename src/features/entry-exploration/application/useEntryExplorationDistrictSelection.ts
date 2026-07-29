import { useCallback, useRef, useState } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export type UseEntryExplorationDistrictSelectionOptions = {
  createExtraSceneInteractionControllers?: () => readonly EntryExplorationSceneInteractionController[];
};

const createNoExtraSceneInteractionControllers =
  (): readonly EntryExplorationSceneInteractionController[] => [];

export function useEntryExplorationDistrictSelection({
  createExtraSceneInteractionControllers = createNoExtraSceneInteractionControllers,
}: UseEntryExplorationDistrictSelectionOptions = {}) {
  const sceneControlsRef = useRef<EntryExplorationThreeSceneControls | null>(null);
  const [selectionResult, setSelectionResult] =
    useState<EntryExplorationDistrictSelectionResult | null>(null);

  const createSceneInteractionControllers = useCallback(
    () =>
      createEntryExplorationSceneInteractionControllers({
        extraControllers: createExtraSceneInteractionControllers(),
        onDistrictSelectionResult: setSelectionResult,
      }),
    [createExtraSceneInteractionControllers]
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
