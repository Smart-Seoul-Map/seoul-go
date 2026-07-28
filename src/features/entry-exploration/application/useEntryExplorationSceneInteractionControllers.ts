import { useCallback, useEffect, useRef, useState } from "react";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import {
  createEntryExplorationSubwaySelectionInitialState,
  type EntryExplorationSubwaySelectionInteractionController,
  type EntryExplorationSubwaySelectionState,
} from "./entryExplorationSubwaySelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntryExplorationSubwaySelectionViewModel = EntryExplorationSubwaySelectionState & {
  handleClose: () => void;
  handleStationSelection: () => void;
};

type EntryExplorationSceneInteractionControllersViewModel = {
  createSceneInteractionControllers: () => EntryExplorationSceneInteractionController[];
  subwaySelection: EntryExplorationSubwaySelectionViewModel;
};

export function useEntryExplorationSceneInteractionControllers(): EntryExplorationSceneInteractionControllersViewModel {
  const subwaySelectionControllerRef =
    useRef<EntryExplorationSubwaySelectionInteractionController | null>(null);
  const [subwaySelectionState, setSubwaySelectionState] =
    useState<EntryExplorationSubwaySelectionState>(
      createEntryExplorationSubwaySelectionInitialState
    );

  const createSceneInteractionControllers = useCallback(() => {
    const { controllers, subwaySelectionController } =
      createEntryExplorationSceneInteractionControllers({
        subwaySelection: {
          onStateChange: setSubwaySelectionState,
        },
      });

    subwaySelectionControllerRef.current = subwaySelectionController;

    return controllers;
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
    createSceneInteractionControllers,
    subwaySelection: {
      ...subwaySelectionState,
      handleClose,
      handleStationSelection,
    },
  };
}
