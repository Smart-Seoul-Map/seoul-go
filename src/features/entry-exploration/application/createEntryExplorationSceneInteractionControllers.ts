import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import { createEntryExplorationSeoulTileMapViewInteractionController } from "./entryExplorationSeoulTileMapViewInteraction";
import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions = {
  getCollectedNumbers?: () => readonly number[];
  onDartEntryBlocked?: () => void;
  extraControllers?: readonly EntryExplorationSceneInteractionController[];
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onDartTargetHoverChange?: (isOverValidCell: boolean) => void;
  onDartViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onDartViewActiveChange?: (isActive: boolean) => void;
  onDistrictSelectionResult?: (result: EntryExplorationDistrictSelectionResult) => void;
};

export function createEntryExplorationSceneInteractionControllers({
  getCollectedNumbers,
  onDartEntryBlocked,
  extraControllers = [],
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDartViewControlsReady,
  onDistrictSelectionResult,
}: CreateEntryExplorationSceneInteractionControllersOptions = {}): EntryExplorationSceneInteractionController[] {
  return [
    createEntryExplorationDistrictJumpSelectionInteractionController({
      onSelectionResult: onDistrictSelectionResult,
    }),
    createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers,
      onEntryBlocked: onDartEntryBlocked,
      onActiveChange: onDartViewActiveChange,
      onControlsReady: onDartViewControlsReady,
      onDartThrowResult,
      onTargetHoverChange: onDartTargetHoverChange,
    }),
    ...extraControllers,
  ];
}
