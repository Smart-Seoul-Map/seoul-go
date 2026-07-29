import { useCallback, useEffect, useRef, useState } from "react";

import {
  createEntryExplorationSubwaySelectionInteractionController,
  createEntryExplorationSubwaySelectionInitialState,
  type EntryExplorationSubwaySelectionInteractionController,
  type EntryExplorationSubwaySelectionState,
} from "./entryExplorationSubwaySelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntryExplorationSubwaySelectionViewModel = EntryExplorationSubwaySelectionState & {
  handleClose: () => void;
  handleStationSelection: () => void;
};

type EntryExplorationSubwaySelectionHookResult = {
  createSubwayInteractionControllers: () => readonly EntryExplorationSceneInteractionController[];
  subwaySelection: EntryExplorationSubwaySelectionViewModel;
};

export function useEntryExplorationSubwaySelection(): EntryExplorationSubwaySelectionHookResult {
  const subwaySelectionControllerRef =
    useRef<EntryExplorationSubwaySelectionInteractionController | null>(null);
  const [subwaySelectionState, setSubwaySelectionState] =
    useState<EntryExplorationSubwaySelectionState>(
      createEntryExplorationSubwaySelectionInitialState
    );

  const createSubwayInteractionControllers = useCallback(() => {
    const subwaySelectionController = createEntryExplorationSubwaySelectionInteractionController({
      onStateChange: setSubwaySelectionState,
    });

    subwaySelectionControllerRef.current = subwaySelectionController;

    return [subwaySelectionController];
  }, []);

  const handleClose = useCallback(() => {
    subwaySelectionControllerRef.current?.deactivate();
  }, []);

  const handleStationSelection = useCallback(() => {
    subwaySelectionControllerRef.current?.selectStation(performance.now());
  }, []);

  useEffect(
    () => () => {
      subwaySelectionControllerRef.current = null;
    },
    []
  );

  return {
    createSubwayInteractionControllers,
    subwaySelection: {
      ...subwaySelectionState,
      handleClose,
      handleStationSelection,
    },
  };
}
