import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions = {
  onDistrictSelectionResult?: (result: EntryExplorationDistrictSelectionResult) => void;
};

export function createEntryExplorationSceneInteractionControllers({
  onDistrictSelectionResult,
}: CreateEntryExplorationSceneInteractionControllersOptions = {}): EntryExplorationSceneInteractionController[] {
  return [
    createEntryExplorationDistrictJumpSelectionInteractionController({
      onSelectionResult: onDistrictSelectionResult,
    }),
  ];
}
