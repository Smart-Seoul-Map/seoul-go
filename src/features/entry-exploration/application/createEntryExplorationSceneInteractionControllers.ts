import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export function createEntryExplorationSceneInteractionControllers({
  extraControllers = [],
}: {
  extraControllers?: readonly EntryExplorationSceneInteractionController[];
} = {}): EntryExplorationSceneInteractionController[] {
  return [createEntryExplorationDistrictJumpSelectionInteractionController(), ...extraControllers];
}
