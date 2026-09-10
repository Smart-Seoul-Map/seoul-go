import { createContext, useContext } from "react";
import type {
  BottomSheetOptions,
  PanelOpenChangeDetails,
  PanelSnapPoint,
  SidePanelOptions,
} from "./panelTypes";

export type PanelContextValue = {
  id: string;
  parentId: string | null;
  open: boolean;
  isDesktop: boolean;
  modal: boolean;
  dismissible: boolean;
  skipAnimation: boolean;
  side: SidePanelOptions;
  sheet: BottomSheetOptions;
  snapPoint: PanelSnapPoint | null;
  setSnapPoint: (point: PanelSnapPoint) => void;
  changeOpen: (open: boolean, reason: PanelOpenChangeDetails["reason"]) => void;
};

export const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanelContext(): PanelContextValue {
  const context = useContext(PanelContext);
  if (!context) throw new Error("AppResponsivePanel parts must be inside AppResponsivePanel.Root.");
  return context;
}

export function useResponsivePanelPresentation(): "side-panel" | "bottom-sheet" {
  return usePanelContext().isDesktop ? "side-panel" : "bottom-sheet";
}
