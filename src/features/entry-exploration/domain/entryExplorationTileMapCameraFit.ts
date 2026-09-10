import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";

export type EntryExplorationCameraOffset = EntryExplorationScenePoint & { y: number };

export type EntryExplorationTileMapCameraZoomOptions = {
  cameraOffset: EntryExplorationCameraOffset;
  focusPoint: EntryExplorationScenePoint;
  maxZoom: number;
  points: readonly EntryExplorationScenePoint[];
  viewHalfWidth: number;
  widthUsageRatio: number;
};

export type EntryExplorationTileMapCameraFocusOptions = {
  cameraOffset: EntryExplorationCameraOffset;
  contentCenterScreenRatio: number;
  focusPoint: EntryExplorationScenePoint;
  points: readonly EntryExplorationScenePoint[];
  viewHalfHeight: number;
  zoom: number;
};

const VIEW_CENTER_SCREEN_RATIO = 0.5;

function getCameraRightAxis(
  cameraOffset: EntryExplorationCameraOffset
): EntryExplorationScenePoint {
  const horizontalLength = Math.hypot(cameraOffset.x, cameraOffset.z);

  if (horizontalLength === 0) {
    return { x: 1, z: 0 };
  }

  return { x: cameraOffset.z / horizontalLength, z: -cameraOffset.x / horizontalLength };
}

function getCameraUpAxis(cameraOffset: EntryExplorationCameraOffset): EntryExplorationScenePoint {
  const horizontalLength = Math.hypot(cameraOffset.x, cameraOffset.z);
  const length = Math.hypot(horizontalLength, cameraOffset.y);

  if (horizontalLength === 0 || length === 0) {
    return { x: 0, z: 0 };
  }

  const scale = cameraOffset.y / (horizontalLength * length);

  return { x: -cameraOffset.x * scale, z: -cameraOffset.z * scale };
}

function getScreenSpan(
  points: readonly EntryExplorationScenePoint[],
  focusPoint: EntryExplorationScenePoint,
  axis: EntryExplorationScenePoint
): { max: number; min: number } | null {
  if (points.length === 0) {
    return null;
  }

  return points.reduce(
    (span, point) => {
      const projected = (point.x - focusPoint.x) * axis.x + (point.z - focusPoint.z) * axis.z;

      return { max: Math.max(span.max, projected), min: Math.min(span.min, projected) };
    },
    { max: -Infinity, min: Infinity }
  );
}

export function getEntryExplorationTileMapCameraZoom({
  cameraOffset,
  focusPoint,
  maxZoom,
  points,
  viewHalfWidth,
  widthUsageRatio,
}: EntryExplorationTileMapCameraZoomOptions): number {
  const span = getScreenSpan(points, focusPoint, getCameraRightAxis(cameraOffset));
  const requiredHalfWidth = span === null ? 0 : Math.max(Math.abs(span.max), Math.abs(span.min));

  if (requiredHalfWidth === 0 || viewHalfWidth <= 0) {
    return maxZoom;
  }

  return Math.min(maxZoom, (viewHalfWidth * widthUsageRatio) / requiredHalfWidth);
}

export function getEntryExplorationTileMapCameraFocus({
  cameraOffset,
  contentCenterScreenRatio,
  focusPoint,
  points,
  viewHalfHeight,
  zoom,
}: EntryExplorationTileMapCameraFocusOptions): EntryExplorationScenePoint {
  const upAxis = getCameraUpAxis(cameraOffset);
  const span = getScreenSpan(points, focusPoint, upAxis);
  const horizontalLength = Math.hypot(cameraOffset.x, cameraOffset.z);

  if (span === null || zoom <= 0 || horizontalLength === 0) {
    return focusPoint;
  }

  const contentCenter = (span.max + span.min) / 2;
  const targetCenter =
    (VIEW_CENTER_SCREEN_RATIO - contentCenterScreenRatio) * ((viewHalfHeight * 2) / zoom);
  const length = Math.hypot(horizontalLength, cameraOffset.y);
  const shift = ((targetCenter - contentCenter) * length) / cameraOffset.y;

  return {
    x: focusPoint.x + (cameraOffset.x / horizontalLength) * shift,
    z: focusPoint.z + (cameraOffset.z / horizontalLength) * shift,
  };
}

export function getEntryExplorationRectanglePoints(
  center: EntryExplorationScenePoint,
  size: { depth: number; width: number }
): readonly EntryExplorationScenePoint[] {
  const halfWidth = size.width / 2;
  const halfDepth = size.depth / 2;

  return [
    { x: center.x - halfWidth, z: center.z - halfDepth },
    { x: center.x + halfWidth, z: center.z - halfDepth },
    { x: center.x - halfWidth, z: center.z + halfDepth },
    { x: center.x + halfWidth, z: center.z + halfDepth },
  ];
}
