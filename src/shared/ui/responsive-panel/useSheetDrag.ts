import {
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { PanelContextValue } from "./panelContext";
import { getSnapHeight, resolveDragDestination } from "./sheetSnapPoints";

type DragSession = {
  pointerId: number;
  touchId?: number;
  startY: number;
  startX: number;
  startHeight: number;
  deltaY: number;
  dragging: boolean;
  target: HTMLElement;
};

const DRAG_INTENT_DISTANCE = 6;
const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, [contenteditable='true'], [data-panel-no-drag]";

export function useSheetDrag(
  contentRef: RefObject<HTMLElement | null>,
  panel: PanelContextValue,
  showHandle: boolean
) {
  const session = useRef<DragSession | null>(null);
  const suppressHandleClick = useRef(false);
  const currentPanel = useRef(panel);
  useLayoutEffect(() => {
    currentPanel.current = panel;
  });

  useLayoutEffect(() => {
    if (panel.isDesktop || !panel.open) {
      session.current = null;
      contentRef.current?.style.removeProperty("--panel-drag-y");
      contentRef.current?.style.removeProperty("--panel-drag-height");
      contentRef.current?.removeAttribute("data-dragging");
    }
  }, [panel.isDesktop, panel.open, contentRef]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const content = contentRef.current;
    if (panel.isDesktop || !panel.dismissible || !content || !event.isPrimary || event.button !== 0)
      return;
    if (!(event.target instanceof HTMLElement)) return;
    const isHandle = !!event.target.closest("[data-panel-handle]");
    if (panel.sheet.handleOnly && showHandle && !isHandle) return;
    if (!isHandle && event.target.closest(INTERACTIVE_SELECTOR)) return;
    if (!isHandle && event.target.closest<HTMLElement>(".AppResponsivePanelBody")?.scrollTop)
      return;
    suppressHandleClick.current = false;
    session.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startX: event.clientX,
      startHeight: content.getBoundingClientRect().height,
      deltaY: 0,
      dragging: false,
      target: content,
    };
  };

  useLayoutEffect(() => {
    const handleMove = (
      event: Pick<
        PointerEvent,
        "pointerId" | "clientX" | "clientY" | "cancelable" | "preventDefault"
      >
    ) => {
      const drag = session.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const delta = event.clientY - drag.startY;
      if (!drag.dragging && Math.abs(delta) < DRAG_INTENT_DISTANCE) return;
      if (!drag.dragging && Math.abs(event.clientX - drag.startX) > Math.abs(delta)) {
        session.current = null;
        return;
      }
      const state = currentPanel.current;
      if (delta < 0 && !state.sheet.snapPoints?.length) {
        session.current = null;
        return;
      }
      drag.dragging = true;
      drag.deltaY = delta;
      suppressHandleClick.current = true;
      if (event.cancelable) event.preventDefault();
      drag.target.setPointerCapture?.(event.pointerId);
      drag.target.dataset.dragging = "true";
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const heights = state.sheet.snapPoints?.map((point) =>
        getSnapHeight(point, viewportHeight)
      ) ?? [drag.startHeight];
      const targetHeight = drag.startHeight - delta;
      const lowestHeight = Math.min(...heights);
      if (state.sheet.snapPoints?.length) {
        drag.target.style.setProperty(
          "--panel-drag-height",
          `${Math.max(lowestHeight, Math.min(Math.max(...heights), targetHeight))}px`
        );
      }
      drag.target.style.setProperty(
        "--panel-drag-y",
        `${Math.max(0, lowestHeight - targetHeight)}px`
      );
    };
    const finishDrag = (event: Pick<PointerEvent, "pointerId" | "type">) => {
      const drag = session.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      session.current = null;
      drag.target.removeAttribute("data-dragging");
      drag.target.style.removeProperty("--panel-drag-y");
      drag.target.style.removeProperty("--panel-drag-height");
      if (drag.target.hasPointerCapture?.(event.pointerId))
        drag.target.releasePointerCapture(event.pointerId);
      if (!drag.dragging || event.type === "pointercancel") return;
      const state = currentPanel.current;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const points = state.sheet.snapPoints;
      const heights = points?.map((point) => getSnapHeight(point, viewportHeight)) ?? [
        drag.startHeight,
      ];
      const destination = resolveDragDestination({
        heights,
        startHeight: drag.startHeight,
        deltaY: drag.deltaY,
        dismissible: state.dismissible,
      });
      if ("close" in destination) state.changeOpen(false, "drag");
      else if (points?.[destination.index] !== undefined)
        state.setSnapPoint(points[destination.index]);
    };
    const handleTouchStart = (event: TouchEvent) => {
      const drag = session.current;
      if (!drag) return;
      if (event.touches.length !== 1) {
        finishDrag({ pointerId: drag.pointerId, type: "pointercancel" });
        return;
      }
      drag.touchId = event.touches[0].identifier;
    };
    // A non-passive touch listener lets an unscrolled body drag without locking its normal scroll.
    const handleTouchMove = (event: TouchEvent) => {
      const drag = session.current;
      if (!drag) return;
      const touch = Array.from(event.touches).find((item) => item.identifier === drag.touchId);
      if (!touch) return;
      handleMove({
        pointerId: drag.pointerId,
        clientX: touch.clientX,
        clientY: touch.clientY,
        cancelable: event.cancelable,
        preventDefault: () => event.preventDefault(),
      });
    };
    const handleTouchEnd = (event: TouchEvent) => {
      const drag = session.current;
      if (
        !drag ||
        !Array.from(event.changedTouches).some((item) => item.identifier === drag.touchId)
      )
        return;
      finishDrag({
        pointerId: drag.pointerId,
        type: event.type === "touchcancel" ? "pointercancel" : "pointerup",
      });
    };
    document.addEventListener("pointermove", handleMove, { passive: false });
    document.addEventListener("pointerup", finishDrag);
    document.addEventListener("pointercancel", finishDrag);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", finishDrag);
      document.removeEventListener("pointercancel", finishDrag);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const handleHandleClick = () => {
    if (suppressHandleClick.current) {
      suppressHandleClick.current = false;
      return;
    }
    const points = panel.sheet.snapPoints ?? [];
    const nextIndex = points.findIndex((point) => point === panel.snapPoint) + 1;
    if (nextIndex < points.length) panel.setSnapPoint(points[nextIndex]);
    else if (panel.dismissible && panel.sheet.closeOnFinalSnapClick !== false)
      panel.changeOpen(false, "handleClickOnLastSnapPoint");
  };

  return { handlePointerDown, handleHandleClick };
}
