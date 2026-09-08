import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

import { PanelContext, usePanelContext } from "./panelContext";
import type {
  AppResponsivePanelBodyProps,
  AppResponsivePanelCloseButtonProps,
  AppResponsivePanelContentProps,
  AppResponsivePanelFooterProps,
  AppResponsivePanelRootProps,
  AppResponsivePanelTriggerProps,
  PanelOpenChangeDetails,
  PanelSnapPoint,
} from "./panelTypes";
import { getSnapCssHeight } from "./sheetSnapPoints";
import { usePanelModal } from "./usePanelModal";
import { usePanelPresence } from "./usePanelPresence";
import { useSheetDrag } from "./useSheetDrag";
import "./responsive-panel.css";

const subscribeViewport = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
const getDesktopSnapshot = () => {
  const breakpoint =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sg-breakpoint-md")) ||
    768;
  return window.innerWidth >= breakpoint;
};

function Root({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  dismissible = true,
  skipAnimation = false,
  sidePanelRootProps = {},
  bottomSheetRootProps = {},
}: AppResponsivePanelRootProps): ReactElement {
  const id = useId();
  const parent = useContext(PanelContext);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalSnap, setInternalSnap] = useState<PanelSnapPoint | null>(
    bottomSheetRootProps.snapPoints?.[0] ?? null
  );
  const isDesktop = useSyncExternalStore(subscribeViewport, getDesktopSnapshot, () => true);
  const open = controlledOpen ?? internalOpen;
  const options = isDesktop ? sidePanelRootProps : bottomSheetRootProps;
  const activeSnap =
    bottomSheetRootProps.activeSnapPoint === undefined
      ? internalSnap
      : bottomSheetRootProps.activeSnapPoint;
  const snapPoint = activeSnap ?? bottomSheetRootProps.snapPoints?.[0] ?? null;
  const changeOpen = useCallback(
    (next: boolean, reason: PanelOpenChangeDetails["reason"]) => {
      if (next === open) return;
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next, { reason });
    },
    [controlledOpen, onOpenChange, open]
  );
  const setSnapPoint = (point: PanelSnapPoint) => {
    if (bottomSheetRootProps.activeSnapPoint === undefined) setInternalSnap(point);
    bottomSheetRootProps.setActiveSnapPoint?.(point);
  };

  return (
    <PanelContext.Provider
      value={{
        id,
        parentId: parent?.id ?? null,
        open,
        isDesktop,
        modal: options.modal ?? modal,
        dismissible: options.dismissible ?? dismissible,
        skipAnimation: !isDesktop
          ? (bottomSheetRootProps.skipAnimation ?? skipAnimation)
          : skipAnimation,
        side: sidePanelRootProps,
        sheet: bottomSheetRootProps,
        snapPoint,
        setSnapPoint,
        changeOpen,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}

function Trigger({
  asChild = false,
  children,
  onClick,
  ...props
}: AppResponsivePanelTriggerProps): ReactElement {
  const panel = usePanelContext();
  const handleClick: AppResponsivePanelTriggerProps["onClick"] = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) panel.changeOpen(true, "trigger");
  };
  const buttonProps: AppResponsivePanelTriggerProps = {
    type: "button",
    ...props,
    "aria-haspopup": "dialog",
    "aria-expanded": panel.open,
    "aria-controls": panel.id,
    onClick: handleClick,
  };
  if (!asChild) return <button {...buttonProps}>{children}</button>;
  const child = Children.only(children);
  if (!isValidElement<AppResponsivePanelTriggerProps>(child))
    throw new Error("AppResponsivePanel.Trigger asChild requires a single element.");
  return cloneElement(child, {
    ...buttonProps,
    disabled: props.disabled ?? child.props.disabled,
    className: [child.props.className, props.className].filter(Boolean).join(" ") || undefined,
    style: { ...child.props.style, ...props.style },
    ref: (element) => {
      const cleanups = [props.ref, child.props.ref].map((ref) => {
        if (typeof ref === "function") {
          const cleanup = ref(element);
          return () => {
            if (typeof cleanup === "function") cleanup();
            else ref(null);
          };
        }
        if (ref) ref.current = element;
        return () => {
          if (ref) ref.current = null;
        };
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    },
    onClick: (event) => {
      child.props.onClick?.(event);
      if (!event.defaultPrevented) handleClick(event);
    },
  });
}

function CloseButton({
  onClick,
  children,
  ...props
}: AppResponsivePanelCloseButtonProps): ReactElement {
  const panel = usePanelContext();
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) panel.changeOpen(false, "closeButton");
      }}
    >
      {children}
    </button>
  );
}

function Content(props: AppResponsivePanelContentProps): ReactElement | null {
  const panel = usePanelContext();
  const contentRef = useRef<HTMLElement | null>(null);
  const { present, finishExit } = usePanelPresence(panel.open, panel.skipAnimation, contentRef);
  if (!present) return null;
  return <MountedContent {...props} contentRef={contentRef} finishExit={finishExit} />;
}

type MountedContentProps = AppResponsivePanelContentProps & {
  contentRef: React.RefObject<HTMLElement | null>;
  finishExit: () => void;
};

function MountedContent({
  title,
  description,
  hideTitle = false,
  showCloseButton = true,
  showHandle = false,
  children,
  className,
  width,
  maxWidth,
  style,
  contentRef,
  finishExit,
  onAnimationEnd,
  onPointerDown,
  ...props
}: MountedContentProps): ReactElement {
  const panel = usePanelContext();
  const [portal] = useState(() => document.createElement("div"));
  useLayoutEffect(() => {
    document.body.append(portal);
    return () => portal.remove();
  }, [portal]);
  usePanelModal({
    id: panel.id,
    parentId: panel.parentId,
    active: true,
    modal: panel.modal,
    dismissible: panel.dismissible && panel.open,
    contentRef,
    onEscape: () => panel.changeOpen(false, "escapeKeyDown"),
  });
  const drag = useSheetDrag(contentRef, panel, showHandle);
  const presentation = panel.isDesktop ? "side-panel" : "bottom-sheet";
  const snapIndex = panel.sheet.snapPoints?.findIndex((point) => point === panel.snapPoint) ?? 0;
  const backdropVisible = panel.isDesktop || snapIndex >= (panel.sheet.fadeFromIndex ?? 0);
  const contentStyle = {
    "--panel-custom-width": typeof width === "number" ? `${width}px` : width,
    "--panel-custom-max-width": typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
    "--panel-snap-height":
      !panel.isDesktop && panel.snapPoint !== null ? getSnapCssHeight(panel.snapPoint) : undefined,
    ...style,
  } as CSSProperties;

  return createPortal(
    <div
      className="AppResponsivePanelLayer"
      data-presentation={presentation}
      data-state={panel.open ? "open" : "closed"}
      data-direction={panel.side.direction ?? "right"}
      data-skip-animation={panel.skipAnimation || undefined}
    >
      {panel.modal && (
        <div
          className="AppResponsivePanelBackdrop"
          data-faded={backdropVisible}
          aria-hidden="true"
          onClick={() => {
            if (panel.dismissible && panel.open) panel.changeOpen(false, "interactOutside");
          }}
        />
      )}
      <section
        {...props}
        id={panel.id}
        ref={contentRef}
        role="dialog"
        aria-modal={panel.modal || undefined}
        aria-labelledby={`${panel.id}-title`}
        aria-describedby={description ? `${panel.id}-description` : undefined}
        tabIndex={-1}
        className={["AppResponsivePanelContent", className].filter(Boolean).join(" ")}
        style={contentStyle}
        data-presentation={presentation}
        data-state={panel.open ? "open" : "closed"}
        data-size={panel.side.size ?? "medium"}
        data-header-align={panel.sheet.headerAlign ?? "left"}
        data-hide-title={hideTitle || undefined}
        data-has-close={showCloseButton || undefined}
        onAnimationEnd={(event) => {
          onAnimationEnd?.(event);
          if (event.target === event.currentTarget) finishExit();
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!event.defaultPrevented) drag.handlePointerDown(event);
        }}
      >
        {!panel.isDesktop && showHandle && (
          <button
            type="button"
            className="AppResponsivePanelHandle"
            data-panel-handle
            aria-label="패널 높이 조절"
            title="패널 높이 조절"
            onClick={drag.handleHandleClick}
          >
            <span />
          </button>
        )}
        <header className="AppResponsivePanelHeader" data-hidden={hideTitle || undefined}>
          <h2 id={`${panel.id}-title`} className="AppResponsivePanelTitle">
            {title}
          </h2>
          {description && (
            <div id={`${panel.id}-description`} className="AppResponsivePanelDescription">
              {description}
            </div>
          )}
        </header>
        {showCloseButton && (
          <CloseButton aria-label="닫기" title="닫기" className="AppResponsivePanelClose">
            <span aria-hidden="true">×</span>
          </CloseButton>
        )}
        {children}
      </section>
    </div>,
    portal
  );
}

function Body({
  className,
  maxHeight,
  style,
  onScroll,
  ...props
}: AppResponsivePanelBodyProps): ReactElement {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div
      {...props}
      className={["AppResponsivePanelBody", className].filter(Boolean).join(" ")}
      style={{ maxHeight, ...style }}
      data-scrolled={scrolled || undefined}
      onScroll={(event) => {
        setScrolled(event.currentTarget.scrollTop > 0);
        onScroll?.(event);
      }}
    />
  );
}

function Footer({ className, ...props }: AppResponsivePanelFooterProps): ReactElement {
  return (
    <footer
      {...props}
      className={["AppResponsivePanelFooter", className].filter(Boolean).join(" ")}
    />
  );
}

export const AppResponsivePanel = { Root, Trigger, Content, Body, Footer, CloseButton };
