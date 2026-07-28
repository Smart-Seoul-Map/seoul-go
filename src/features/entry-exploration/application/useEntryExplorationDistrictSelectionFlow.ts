import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createDistrictExplorationPath } from "@shared/constants/path";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

export function useEntryExplorationDistrictSelectionFlow() {
  const navigate = useNavigate();
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

  const handleBackToExploration = useCallback(() => {
    setSelectionResult(null);
    sceneControlsRef.current?.deactivateActiveInteraction();
  }, []);

  const handleRetrySelection = useCallback(() => {
    setSelectionResult(null);
    sceneControlsRef.current?.retryActiveInteraction();
  }, []);

  const handleExploreDistrict = useCallback(() => {
    if (selectionResult?.districtId === null || selectionResult?.districtId === undefined) {
      return;
    }

    navigate(createDistrictExplorationPath(selectionResult.districtId));
  }, [navigate, selectionResult?.districtId]);

  return {
    createSceneInteractionControllers,
    dialogProps: {
      districtId: selectionResult?.districtId ?? null,
      districtName: selectionResult?.districtName ?? null,
      onBack: handleBackToExploration,
      onExplore: handleExploreDistrict,
      onRetry: handleRetrySelection,
      open: selectionResult !== null,
    },
    handleSceneControlsReady,
  };
}
