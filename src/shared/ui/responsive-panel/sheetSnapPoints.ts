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
};

export function resolveDragDestination({
  heights,
  startHeight,
  deltaY,
  dismissible,
}: DragDestinationInput): { close: true } | { index: number } {
  const targetHeight = startHeight - deltaY;
  const lowestHeight = Math.min(...heights);
  if (dismissible && targetHeight < lowestHeight / 2) return { close: true };
  const index = heights.reduce(
    (best, height, current) =>
      Math.abs(height - targetHeight) < Math.abs(heights[best] - targetHeight) ? current : best,
    0
  );
  return { index };
}
