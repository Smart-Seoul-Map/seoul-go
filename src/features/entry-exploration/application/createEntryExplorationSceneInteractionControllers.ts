import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import {
  createEntryExplorationSubwaySelectionInteractionController,
  type EntryExplorationSubwaySelectionInteractionController,
  type EntryExplorationSubwaySelectionInteractionOptions,
} from "./entryExplorationSubwaySelectionInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions = {
  subwaySelection?: EntryExplorationSubwaySelectionInteractionOptions;
};

export type EntryExplorationSceneInteractionControllerCollection = {
  controllers: EntryExplorationSceneInteractionController[];
  subwaySelectionController: EntryExplorationSubwaySelectionInteractionController;
};

export function createEntryExplorationSceneInteractionControllers({
  subwaySelection,
}: CreateEntryExplorationSceneInteractionControllersOptions = {}): EntryExplorationSceneInteractionControllerCollection {
  const subwaySelectionController =
    createEntryExplorationSubwaySelectionInteractionController(subwaySelection);

  return {
    controllers: [
      createEntryExplorationDistrictJumpSelectionInteractionController(),
      subwaySelectionController,
    ],
    subwaySelectionController,
  };
}
