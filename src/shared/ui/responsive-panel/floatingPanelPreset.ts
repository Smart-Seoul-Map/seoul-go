import type { BottomSheetOptions, SidePanelOptions } from "./panelTypes";

export const FLOATING_PANEL_SIDE_OPTIONS = {
  presentation: "floating",
  direction: "right",
  size: "small",
} satisfies SidePanelOptions;

export const FLOATING_PANEL_SHEET_OPTIONS = {
  snapPoints: [0.5, 0.9],
  handleOnly: true,
  closeOnFinalSnapClick: false,
} satisfies BottomSheetOptions;
