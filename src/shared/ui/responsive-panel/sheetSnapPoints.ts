import type { PanelSnapPoint } from "./panelTypes";

export function getSnapHeight(point: PanelSnapPoint, viewportHeight: number): number {
  if (typeof point === "number") return Math.max(0, Math.min(point, 1)) * viewportHeight;
  return Math.max(0, Number.parseFloat(point));
}

export function getSnapCssHeight(point: PanelSnapPoint): string {
  return typeof point === "number" ? `${Math.max(0, Math.min(point, 1)) * 100}dvh` : point;
}

type DragDestinationInput = {
  heights: number[];
  startHeight: number;
  deltaY: number;
  dismissible: boolean;
  closeThreshold?: number;
};

export function resolveDragDestination({
  heights,
  startHeight,
  deltaY,
  dismissible,
  closeThreshold = 0.5,
}: DragDestinationInput): { close: true } | { index: number } {
  const targetHeight = startHeight - deltaY;
  const lowestHeight = Math.min(...heights);
  const closeThresholdRatio = Math.max(0, Math.min(closeThreshold, 1));
  if (dismissible && targetHeight < lowestHeight * closeThresholdRatio) return { close: true };
  const index = heights.reduce(
    (best, height, current) =>
      Math.abs(height - targetHeight) < Math.abs(heights[best] - targetHeight) ? current : best,
    0
  );
  return { index };
}
