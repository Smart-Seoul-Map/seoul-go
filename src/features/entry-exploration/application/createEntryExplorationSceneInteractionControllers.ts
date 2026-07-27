import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export function createEntryExplorationSceneInteractionControllers(): EntryExplorationSceneInteractionController[] {
  return [createEntryExplorationDistrictJumpSelectionInteractionController()];
}
