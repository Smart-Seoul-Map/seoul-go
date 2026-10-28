import { createEntryExplorationSeoulTileMapViewInteractionController } from "./entryExplorationSeoulTileMapViewInteraction";
import { createEntrySlotInteraction } from "./entrySlotInteraction";
import type {
  EntryExplorationDartRouletteHighlight,
  EntryExplorationDartRouletteLayout,
  EntryExplorationDartRouletteWin,
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
  onRouletteCameraSettled?: () => void;
  onRouletteEntryBlocked?: () => void;
  onRouletteHighlight?: (highlight: EntryExplorationDartRouletteHighlight) => void;
  onRouletteLayoutChange?: (layout: EntryExplorationDartRouletteLayout) => void;
  onRouletteThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onRouletteViewActiveChange?: (isActive: boolean) => void;
  onRouletteViewControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onRouletteWin?: (win: EntryExplorationDartRouletteWin) => void;
};

export function createEntryExplorationSceneInteractionControllers({
  getCollectedNumbers,
  onDartEntryBlocked,
  onDartThrowResult,
  onDartTargetHoverChange,
  onDartViewActiveChange,
  onDartViewControlsReady,
  onRouletteCameraSettled,
  onRouletteEntryBlocked,
  onRouletteHighlight,
  onRouletteLayoutChange,
  onRouletteThrowResult,
  onRouletteViewActiveChange,
  onRouletteViewControlsReady,
  onRouletteWin,
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
      onEntryBlocked: onRouletteEntryBlocked,
      onActiveChange: onRouletteViewActiveChange,
      onCameraSettled: onRouletteCameraSettled,
      onControlsReady: onRouletteViewControlsReady,
      onDartThrowResult: onRouletteThrowResult,
      onRouletteHighlight,
      onRouletteLayoutChange,
      onRouletteWin,
    }),
    createEntrySlotInteraction(),
  ];
}
