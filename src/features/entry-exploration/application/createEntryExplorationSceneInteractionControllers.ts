import { createEntryExplorationSeoulTileMapViewInteractionController } from "./entryExplorationSeoulTileMapViewInteraction";
import { createEntrySlotInteraction } from "./entrySlotInteraction";
import type { EntryExplorationSeoulTileMapViewInteractionOptions } from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions =
  EntryExplorationSeoulTileMapViewInteractionOptions;

export function createEntryExplorationSceneInteractionControllers(
  options: CreateEntryExplorationSceneInteractionControllersOptions = {}
): EntryExplorationSceneInteractionController[] {
  return [
    createEntryExplorationSeoulTileMapViewInteractionController(options),
    createEntrySlotInteraction(),
  ];
}
