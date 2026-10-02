import type { Coordinates } from "./explorationGeo";

export type ScreenPoint = {
  x: number;
  y: number;
};

export type ScreenSize = {
  height: number;
  width: number;
};

export type OffscreenIndicatorPlacement = ScreenPoint & {
  angleRadians: number;
};

type CalculateOffscreenIndicatorPlacementParams = {
  edgeInset: number;
  groundDirection: ScreenPoint;
  projectedPoint: ScreenPoint;
  screenSize: ScreenSize;
};

type CalculateGroundDirectionOnScreenParams = {
  bearingDegrees: number;
  from: Coordinates;
  pitchDegrees: number;
  to: Coordinates;
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function calculateGroundDirectionOnScreen({
  bearingDegrees,
  from,
  pitchDegrees,
  to,
}: CalculateGroundDirectionOnScreenParams): ScreenPoint {
  const east = (to.lng - from.lng) * Math.cos(toRadians(from.lat));
  const north = to.lat - from.lat;
  const bearing = toRadians(bearingDegrees);

  return {
    x: east * Math.cos(bearing) - north * Math.sin(bearing),
    y: -(north * Math.cos(bearing) + east * Math.sin(bearing)) * Math.cos(toRadians(pitchDegrees)),
  };
}

export function calculateOffscreenIndicatorPlacement({
  edgeInset,
  groundDirection,
  projectedPoint,
  screenSize,
}: CalculateOffscreenIndicatorPlacementParams): OffscreenIndicatorPlacement | null {
  const centerX = screenSize.width / 2;
  const centerY = screenSize.height / 2;
  const isInFrontOfCamera =
    (projectedPoint.x - centerX) * groundDirection.x +
      (projectedPoint.y - centerY) * groundDirection.y >=
    0;
  const isInsideScreen =
    projectedPoint.x >= 0 &&
    projectedPoint.x <= screenSize.width &&
    projectedPoint.y >= 0 &&
    projectedPoint.y <= screenSize.height;

  if (isInFrontOfCamera && isInsideScreen) {
    return null;
  }

  const { x: deltaX, y: deltaY } = groundDirection;
  const limitX = Math.max(centerX - edgeInset, 0);
  const limitY = Math.max(centerY - edgeInset, 0);
  const scale = Math.min(
    deltaX === 0 ? Number.POSITIVE_INFINITY : limitX / Math.abs(deltaX),
    deltaY === 0 ? Number.POSITIVE_INFINITY : limitY / Math.abs(deltaY)
  );

  return {
    angleRadians: Math.atan2(deltaY, deltaX),
    x: centerX + deltaX * scale,
    y: centerY + deltaY * scale,
  };
}
