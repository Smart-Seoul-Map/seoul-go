import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions = {
  extraControllers?: readonly EntryExplorationSceneInteractionController[];
  onDistrictSelectionResult?: (result: EntryExplorationDistrictSelectionResult) => void;
};

export function createEntryExplorationSceneInteractionControllers({
  extraControllers = [],
  onDistrictSelectionResult,
}: CreateEntryExplorationSceneInteractionControllersOptions = {}): EntryExplorationSceneInteractionController[] {
  return [
    createEntryExplorationDistrictJumpSelectionInteractionController({
      onSelectionResult: onDistrictSelectionResult,
    }),
    ...extraControllers,
  ];
}
