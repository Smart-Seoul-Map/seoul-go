import { useEffect, useRef, useState, type PointerEvent } from "react";

type DragSession = {
  placeId: string;
  pointerId: number;
  button: HTMLButtonElement;
  body: HTMLElement;
  startX: number;
  startY: number;
  startScrollTop: number;
  x: number;
  y: number;
  isDragging: boolean;
  targetId: string | null;
};

const DRAG_INTENT_DISTANCE = 8;
const AUTO_SCROLL_EDGE = 48;
const AUTO_SCROLL_SPEED = 8;

export function useStampCourseDrag(
  enabled: boolean,
  onReorder: (placeId: string, targetPlaceId: string) => void
) {
  const boardRef = useRef<HTMLOListElement>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const frameRef = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const clearDrag = () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    session?.button.style.removeProperty("translate");
    if (session?.button.hasPointerCapture?.(session.pointerId)) {
      session.button.releasePointerCapture(session.pointerId);
    }
  };

  useEffect(() => {
    if (!enabled) {
      clearDrag();
      setDraggingId(null);
      setTargetId(null);
    }
    return clearDrag;
  }, [enabled]);

  const updateDrag = (session: DragSession) => {
    const { body, button, x, y } = session;
    button.style.translate = `${x - session.startX}px ${y - session.startY + body.scrollTop - session.startScrollTop}px`;
    const viewport = body.getBoundingClientRect();
    const isInside =
      x >= viewport.left && x <= viewport.right && y >= viewport.top && y <= viewport.bottom;
    const slots = boardRef.current?.querySelectorAll<HTMLElement>("[data-course-place-id]");
    const target =
      isInside &&
      Array.from(slots ?? []).find((slot) => {
        const rect = slot.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      });
    session.targetId = target ? (target.dataset.coursePlaceId ?? null) : null;
    setTargetId(session.targetId);
  };

  const scrollFrame = () => {
    const session = sessionRef.current;
    if (!session?.isDragging) return;
    const rect = session.body.getBoundingClientRect();
    if (session.x >= rect.left && session.x <= rect.right) {
      if (session.y < rect.top + AUTO_SCROLL_EDGE) session.body.scrollTop -= AUTO_SCROLL_SPEED;
      if (session.y > rect.bottom - AUTO_SCROLL_EDGE) session.body.scrollTop += AUTO_SCROLL_SPEED;
    }
    updateDrag(session);
    frameRef.current = requestAnimationFrame(scrollFrame);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, placeId: string) => {
    if (!enabled || sessionRef.current || !event.isPrimary || event.button !== 0) return;
    const body = boardRef.current?.closest<HTMLElement>(".StampCourseBody");
    if (!body) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    sessionRef.current = {
      placeId,
      pointerId: event.pointerId,
      button: event.currentTarget,
      body,
      startX: event.clientX,
      startY: event.clientY,
      startScrollTop: body.scrollTop,
      x: event.clientX,
      y: event.clientY,
      isDragging: false,
      targetId: null,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLOListElement>) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    session.x = event.clientX;
    session.y = event.clientY;
    if (
      !session.isDragging &&
      Math.hypot(session.x - session.startX, session.y - session.startY) < DRAG_INTENT_DISTANCE
    )
      return;
    event.preventDefault();
    if (!session.isDragging) {
      session.isDragging = true;
      setDraggingId(session.placeId);
      frameRef.current = requestAnimationFrame(scrollFrame);
    }
    updateDrag(session);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLOListElement>) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (event.type === "pointerup" && session.isDragging) {
      session.x = event.clientX;
      session.y = event.clientY;
      updateDrag(session);
      if (session.targetId) onReorder(session.placeId, session.targetId);
    }
    clearDrag();
    setDraggingId(null);
    setTargetId(null);
  };

  return { boardRef, draggingId, targetId, handlePointerDown, handlePointerMove, handlePointerEnd };
}
