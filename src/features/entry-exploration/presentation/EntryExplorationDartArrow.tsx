import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewportPoint,
} from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import { ENTRY_EXPLORATION_DART_CONFIG } from "../config/entryExplorationDartConfig";
import {
  getEntryExplorationDartAimRotation,
  getEntryExplorationDartFlightFrame,
  getEntryExplorationDartSmoothedRotation,
  getEntryExplorationDartTipPoint,
  type EntryExplorationDartScreenPoint,
} from "../domain/entryExplorationDartAim";

import "./EntryExplorationDartArrow.css";

export type EntryExplorationDartArrowProps = {
  isTargetHovered: boolean;
  isVisible: boolean;
  onFlightEnd?: () => void;
  onThrow: () => void;
  shot: EntryExplorationDartThrowResult | null;
};

type DartFlight = {
  from: EntryExplorationDartScreenPoint;
  shot: EntryExplorationDartThrowResult;
  startedAt: number;
  to: EntryExplorationDartScreenPoint;
};

type DartArrowLayout = {
  crosshairSize: number;
  restRatio: { x: number; y: number };
  width: number;
};

type DartArrowMetrics = {
  crosshairSize: number;
  nockOffset: EntryExplorationDartScreenPoint;
  restPoint: EntryExplorationDartScreenPoint;
  scale: number;
  tipOffset: EntryExplorationDartScreenPoint;
  width: number;
};

const { clickHint, crosshair, flight, idleArrow, sprite } = ENTRY_EXPLORATION_DART_CONFIG;

function getArrowLayout(containerWidth: number): DartArrowLayout {
  const { narrowViewport } = idleArrow;

  if (containerWidth === 0 || containerWidth >= narrowViewport.maxContainerWidth) {
    return {
      crosshairSize: crosshair.size,
      restRatio: idleArrow.restRatio,
      width: idleArrow.width,
    };
  }

  return {
    crosshairSize: crosshair.narrowViewportSize,
    restRatio: narrowViewport.restRatio,
    width: containerWidth * narrowViewport.widthRatio,
  };
}

function getArrowMetrics(container: HTMLDivElement): DartArrowMetrics {
  const rect = container.getBoundingClientRect();
  const layout = getArrowLayout(rect.width);
  const height = layout.width * sprite.aspectRatio;

  return {
    crosshairSize: layout.crosshairSize,
    nockOffset: { x: layout.width * sprite.nockRatio.x, y: height * sprite.nockRatio.y },
    restPoint: { x: rect.width * layout.restRatio.x, y: rect.height * layout.restRatio.y },
    scale: layout.width / idleArrow.width,
    tipOffset: { x: layout.width * sprite.tipRatio.x, y: height * sprite.tipRatio.y },
    width: layout.width,
  };
}

function getTipPoint(
  rotationDegrees: number,
  metrics: DartArrowMetrics
): EntryExplorationDartScreenPoint {
  return getEntryExplorationDartTipPoint({
    anchorPoint: metrics.restPoint,
    offsetFromAnchor: {
      x: metrics.tipOffset.x - metrics.nockOffset.x,
      y: metrics.tipOffset.y - metrics.nockOffset.y,
    },
    rotationDegrees,
  });
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
  onThrow,
  shot,
}: EntryExplorationDartArrowProps): ReactElement | null {
  const [isLanded, setIsLanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLButtonElement | null>(null);
  const crosshairRef = useRef<HTMLImageElement | null>(null);
  const clickHintRef = useRef<HTMLImageElement | null>(null);
  const pointerRef = useRef<EntryExplorationDartScreenPoint | null>(null);
  const flightRef = useRef<DartFlight | null>(null);
  const landedShotRef = useRef<EntryExplorationDartThrowResult | null>(null);
  const rotationRef = useRef<number>(idleArrow.restRotationDegrees);
  const isTargetHoveredRef = useRef(isTargetHovered);
  const onFlightEndRef = useRef(onFlightEnd);

  isTargetHoveredRef.current = isTargetHovered;
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
    let lastTime: number | null = null;

    const render = (time: number) => {
      const metrics = getArrowMetrics(container);

      rotationRef.current = getEntryExplorationDartSmoothedRotation({
        current: rotationRef.current,
        deltaMs: lastTime === null ? 0 : time - lastTime,
        target: isTargetHoveredRef.current
          ? getEntryExplorationDartAimRotation({
              aimSpanDegrees: idleArrow.aimSpanDegrees,
              from: metrics.restPoint,
              pointer: pointerRef.current,
              rangeDegrees: idleArrow.aimRotationRangeDegrees,
              restRotationDegrees: idleArrow.restRotationDegrees,
            })
          : idleArrow.restRotationDegrees,
        timeConstantMs: idleArrow.aimTimeConstantMs,
      });
      lastTime = time;

      const activeFlight = flightRef.current;
      const isFlying = activeFlight !== null && time - activeFlight.startedAt < flight.durationMs;

      if (activeFlight && !isFlying && landedShotRef.current !== activeFlight.shot) {
        landedShotRef.current = activeFlight.shot;
        setIsLanded(true);
        onFlightEndRef.current?.();
      }

      drawCrosshair(crosshairRef.current, activeFlight?.to ?? pointerRef.current, metrics);
      drawClickHint(clickHintRef.current, metrics);
      drawArrow(arrowRef.current, activeFlight, rotationRef.current, time, metrics);

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frameId);
      flightRef.current = null;
      landedShotRef.current = null;
      rotationRef.current = idleArrow.restRotationDegrees;
      setIsLanded(false);
    };
  }, [isVisible]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    setIsLanded(false);

    if (!shot) {
      flightRef.current = null;
      landedShotRef.current = null;

      return;
    }

    flightRef.current = {
      from: getTipPoint(rotationRef.current, getArrowMetrics(container)),
      shot,
      startedAt: performance.now(),
      to: toScreenPoint(container, shot.viewportPoint),
    };
  }, [shot]);

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={containerRef} className="entry-exploration-dart-arrow">
      <img
        ref={crosshairRef}
        alt=""
        className="entry-exploration-dart-arrow__crosshair"
        data-shown={!isLanded && (isTargetHovered || shot !== null)}
        src={ENTRY_EXPLORATION_TEXTURE_ASSETS.dartCrosshair.src}
      />

      <img
        ref={clickHintRef}
        alt=""
        className="entry-exploration-dart-arrow__click-hint"
        data-shown={shot === null && !isTargetHovered}
        src={ENTRY_EXPLORATION_TEXTURE_ASSETS.dartClickHint.src}
      />

      <button
        ref={arrowRef}
        aria-label="화살 쏘기"
        className="entry-exploration-dart-arrow__arrow"
        data-landed={isLanded}
        onClick={onThrow}
        type="button"
      >
        <img alt="" src={ENTRY_EXPLORATION_TEXTURE_ASSETS.dartArrow.src} />
      </button>
    </div>
  );
}

function drawCentered(
  element: HTMLImageElement | null,
  point: EntryExplorationDartScreenPoint | null
): void {
  if (!element || !point) {
    return;
  }

  element.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
}

function drawCrosshair(
  element: HTMLImageElement | null,
  point: EntryExplorationDartScreenPoint | null,
  metrics: DartArrowMetrics
): void {
  if (!element) {
    return;
  }

  element.style.width = `${metrics.crosshairSize}px`;
  drawCentered(element, point);
}

function drawClickHint(element: HTMLImageElement | null, metrics: DartArrowMetrics): void {
  if (!element) {
    return;
  }

  const restTipPoint = getTipPoint(idleArrow.restRotationDegrees, metrics);

  element.style.width = `${clickHint.width * metrics.scale}px`;
  drawCentered(element, {
    x: restTipPoint.x + clickHint.offsetFromTip.x * metrics.scale,
    y: restTipPoint.y + clickHint.offsetFromTip.y * metrics.scale,
  });
}

function drawArrow(
  element: HTMLElement | null,
  activeFlight: DartFlight | null,
  rotationDegrees: number,
  time: number,
  metrics: DartArrowMetrics
): void {
  if (!element) {
    return;
  }

  const { nockOffset, restPoint, tipOffset } = metrics;

  element.style.width = `${metrics.width}px`;

  if (!activeFlight) {
    element.style.transformOrigin = `${nockOffset.x}px ${nockOffset.y}px`;
    element.style.transform = `translate(${restPoint.x - nockOffset.x}px, ${restPoint.y - nockOffset.y}px) rotate(${rotationDegrees}deg)`;

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
