import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
} from "react";

export type PanelSnapPoint = number | `${number}px`;
export type PanelOpenChangeDetails = {
  reason:
    | "trigger"
    | "closeButton"
    | "escapeKeyDown"
    | "interactOutside"
    | "drag"
    | "handleClickOnLastSnapPoint";
};

export type SidePanelOptions = {
  presentation?: "attached" | "floating";
  direction?: "left" | "right";
  size?: "small" | "medium" | "large";
  modal?: boolean;
  dismissible?: boolean;
};

export type BottomSheetOptions = {
  modal?: boolean;
  dismissible?: boolean;
  headerAlign?: "left" | "center";
  handleOnly?: boolean;
  skipAnimation?: boolean;
  snapPoints?: PanelSnapPoint[];
  activeSnapPoint?: PanelSnapPoint | null;
  setActiveSnapPoint?: (point: PanelSnapPoint | null) => void;
  fadeFromIndex?: number;
  closeOnFinalSnapClick?: boolean;
  closeThreshold?: number;
  onDrag?: (details: { deltaY: number; height: number }) => void;
  onRelease?: (details: { deltaY: number; destination: "close" | PanelSnapPoint }) => void;
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  lazyMount?: boolean;
  unmountOnExit?: boolean;
};

export type AppResponsivePanelRootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, details: PanelOpenChangeDetails) => void;
  modal?: boolean;
  dismissible?: boolean;
  skipAnimation?: boolean;
  sidePanelRootProps?: SidePanelOptions;
  bottomSheetRootProps?: BottomSheetOptions;
};

export type AppResponsivePanelTriggerProps = ComponentPropsWithRef<"button"> & {
  asChild?: boolean;
};
export type AppResponsivePanelCloseButtonProps = ComponentPropsWithRef<"button">;
export type AppResponsivePanelContentProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  hideTitle?: boolean;
  showCloseButton?: boolean;
  showHandle?: boolean;
  width?: CSSProperties["width"];
  maxWidth?: CSSProperties["maxWidth"];
};
export type AppResponsivePanelBodyProps = ComponentPropsWithoutRef<"div"> & {
  maxHeight?: CSSProperties["maxHeight"];
};
export type AppResponsivePanelFooterProps = ComponentPropsWithoutRef<"footer">;
