import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import { createEntryExplorationSeoulTileMapViewInteractionController } from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationDartThrowResult } from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions = {
  extraControllers?: readonly EntryExplorationSceneInteractionController[];
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onDartTargetHoverChange?: (isOverValidCell: boolean) => void;
  onDartViewActiveChange?: (isActive: boolean) => void;
  onDistrictSelectionResult?: (result: EntryExplorationDistrictSelectionResult) => void;
};

export function createEntryExplorationSceneInteractionControllers({
  extraControllers = [],
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDistrictSelectionResult,
}: CreateEntryExplorationSceneInteractionControllersOptions = {}): EntryExplorationSceneInteractionController[] {
  return [
    createEntryExplorationDistrictJumpSelectionInteractionController({
      onSelectionResult: onDistrictSelectionResult,
    }),
    createEntryExplorationSeoulTileMapViewInteractionController({
      onActiveChange: onDartViewActiveChange,
      onDartThrowResult,
      onTargetHoverChange: onDartTargetHoverChange,
    }),
    ...extraControllers,
  ];
}
