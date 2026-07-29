import { useCallback, useRef, useState } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export function useEntryExplorationDistrictSelection() {
  const sceneControlsRef = useRef<EntryExplorationThreeSceneControls | null>(null);
  const [selectionResult, setSelectionResult] =
    useState<EntryExplorationDistrictSelectionResult | null>(null);

  const createSceneInteractionControllers = useCallback(
    () =>
      createEntryExplorationSceneInteractionControllers({
        onDistrictSelectionResult: setSelectionResult,
      }),
    []
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
