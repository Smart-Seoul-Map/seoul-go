import { useEffect, useRef } from "react";
import type { ReactElement } from "react";

import type { EntryExplorationDartViewportPoint } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import { ENTRY_EXPLORATION_DART_CONFIG } from "../config/entryExplorationDartConfig";
import {
  getEntryExplorationDartFlightFrame,
  getEntryExplorationDartTipPoint,
  type EntryExplorationDartScreenPoint,
} from "../domain/entryExplorationDartAim";

import "./EntryExplorationDartArrow.css";

export type EntryExplorationDartArrowProps = {
  isTargetHovered: boolean;
  isVisible: boolean;
  onFlightEnd?: () => void;
  shotId: number | null;
  targetPoint: EntryExplorationDartViewportPoint | null;
};

type DartFlight = {
  from: EntryExplorationDartScreenPoint;
  shotId: number;
  startedAt: number;
  to: EntryExplorationDartScreenPoint;
};

const ARROW_REST_RATIO = { x: 0.1, y: 1.1 };
const { crosshairSize, flight, idleArrow, sprite } = ENTRY_EXPLORATION_DART_CONFIG;
const spriteHeight = idleArrow.width * sprite.aspectRatio;
const tipOffset = { x: idleArrow.width * sprite.tipRatio.x, y: spriteHeight * sprite.tipRatio.y };
const nockOffset = {
  x: idleArrow.width * sprite.nockRatio.x,
  y: spriteHeight * sprite.nockRatio.y,
};

function getRestPoint(container: HTMLDivElement): EntryExplorationDartScreenPoint {
  const rect = container.getBoundingClientRect();

  return { x: rect.width * ARROW_REST_RATIO.x, y: rect.height * ARROW_REST_RATIO.y };
}

function toScreenPoint(
  container: HTMLDivElement,
  point: EntryExplorationDartViewportPoint
): EntryExplorationDartScreenPoint {
  const rect = container.getBoundingClientRect();

  return { x: rect.width * point.x, y: rect.height * point.y };
}

export function EntryExplorationDartArrow({
  isTargetHovered,
  isVisible,
  onFlightEnd,
  shotId,
  targetPoint,
}: EntryExplorationDartArrowProps): ReactElement | null {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLImageElement | null>(null);
  const crosshairRef = useRef<HTMLImageElement | null>(null);
  const pointerRef = useRef<EntryExplorationDartScreenPoint | null>(null);
  const flightRef = useRef<DartFlight | null>(null);
  const landedShotRef = useRef<number | null>(null);
  const onFlightEndRef = useRef(onFlightEnd);

  onFlightEndRef.current = onFlightEnd;

  useEffect(() => {
    const container = containerRef.current;

    if (!isVisible || !container) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();

      pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    window.addEventListener("pointermove", handlePointerMove);

    let frameId = 0;

    const render = (time: number) => {
      const activeFlight = flightRef.current;
      const isFlying = activeFlight !== null && time - activeFlight.startedAt < flight.durationMs;

      if (activeFlight && !isFlying && landedShotRef.current !== activeFlight.shotId) {
        landedShotRef.current = activeFlight.shotId;
        onFlightEndRef.current?.();
      }

      drawCrosshair(crosshairRef.current, activeFlight?.to ?? pointerRef.current);
      drawArrow(arrowRef.current, activeFlight, getRestPoint(container), time);

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frameId);
      flightRef.current = null;
      landedShotRef.current = null;
    };
  }, [isVisible]);

  useEffect(() => {
    const container = containerRef.current;

    if (shotId === null || !container || !targetPoint) {
      return;
    }

    flightRef.current = {
      from: getEntryExplorationDartTipPoint({
        anchorPoint: getRestPoint(container),
        offsetFromAnchor: { x: tipOffset.x - nockOffset.x, y: tipOffset.y - nockOffset.y },
        rotationDegrees: idleArrow.restRotationDegrees,
      }),
      shotId,
      startedAt: performance.now(),
      to: toScreenPoint(container, targetPoint),
    };
  }, [shotId, targetPoint]);

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={containerRef} className="entry-exploration-dart-arrow">
      <img
        ref={crosshairRef}
        alt=""
        className="entry-exploration-dart-arrow__crosshair"
        data-shown={isTargetHovered || shotId !== null}
        src={ENTRY_EXPLORATION_TEXTURE_ASSETS.dartCrosshair.src}
        style={{ width: crosshairSize }}
      />

      <img
        ref={arrowRef}
        alt=""
        className="entry-exploration-dart-arrow__arrow"
        src={ENTRY_EXPLORATION_TEXTURE_ASSETS.dartArrow.src}
        style={{ width: idleArrow.width }}
      />
    </div>
  );
}

function drawCrosshair(
  element: HTMLImageElement | null,
  point: EntryExplorationDartScreenPoint | null
): void {
  if (!element || !point) {
    return;
  }

  element.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
}

function drawArrow(
  element: HTMLImageElement | null,
  activeFlight: DartFlight | null,
  restPoint: EntryExplorationDartScreenPoint,
  time: number
): void {
  if (!element) {
    return;
  }

  if (!activeFlight) {
    element.style.transformOrigin = `${nockOffset.x}px ${nockOffset.y}px`;
    element.style.transform = `translate(${restPoint.x - nockOffset.x}px, ${restPoint.y - nockOffset.y}px) rotate(${idleArrow.restRotationDegrees}deg)`;

    return;
  }

  const frame = getEntryExplorationDartFlightFrame({
    arcHeightRatio: flight.arcHeightRatio,
    from: activeFlight.from,
    progress: (time - activeFlight.startedAt) / flight.durationMs,
    to: activeFlight.to,
  });

  element.style.transformOrigin = `${tipOffset.x}px ${tipOffset.y}px`;
  element.style.transform = `translate(${frame.x - tipOffset.x}px, ${frame.y - tipOffset.y}px) rotate(${frame.rotation}deg) scale(${frame.scale})`;
}
