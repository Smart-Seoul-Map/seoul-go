import { createEntryExplorationSeoulTileMapViewInteractionController } from "./entryExplorationSeoulTileMapViewInteraction";
import { createEntrySlotInteraction } from "./entrySlotInteraction";
import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type CreateEntryExplorationSceneInteractionControllersOptions = {
  getCollectedNumbers?: () => readonly number[];
  onDartEntryBlocked?: () => void;
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onDartTargetHoverChange?: (isOverValidCell: boolean) => void;
  onDartViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onDartViewActiveChange?: (isActive: boolean) => void;
  onRouletteThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onRouletteViewActiveChange?: (isActive: boolean) => void;
  onRouletteViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
};

export function createEntryExplorationSceneInteractionControllers({
  getCollectedNumbers,
  onDartEntryBlocked,
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDartViewControlsReady,
  onRouletteThrowResult,
  onRouletteViewActiveChange,
  onRouletteViewControlsReady,
}: CreateEntryExplorationSceneInteractionControllersOptions = {}): EntryExplorationSceneInteractionController[] {
  return [
    createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers,
      onEntryBlocked: onDartEntryBlocked,
      onActiveChange: onDartViewActiveChange,
      onControlsReady: onDartViewControlsReady,
      onDartThrowResult,
      onTargetHoverChange: onDartTargetHoverChange,
    }),
    createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers,
      mode: "roulette",
      onEntryBlocked: onDartEntryBlocked,
      onActiveChange: onRouletteViewActiveChange,
      onControlsReady: onRouletteViewControlsReady,
      onDartThrowResult: onRouletteThrowResult,
    }),
    createEntrySlotInteraction(),
  ];
}
