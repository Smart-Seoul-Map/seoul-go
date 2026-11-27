import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";

type EntryIntroScreenAxes = {
  forward: EntryExplorationScenePoint;
  right: EntryExplorationScenePoint;
};

export type EntryIntroScreenExtent = {
  across: number;
  along: number;
};

export type EntryIntroMovementBounds = {
  axes: EntryIntroScreenAxes;
  maxAcross: number;
  maxAlong: number;
  minAcross: number;
  minAlong: number;
};

export type CreateEntryIntroMovementBoundsOptions = {
  cameraOffset: EntryExplorationScenePoint;
  padding: number;
  points: readonly EntryExplorationScenePoint[];
};

export type GetEntryIntroCameraGroundHalfExtentOptions = {
  cameraOffset: EntryExplorationScenePoint & { y: number };
  viewHalfHeight: number;
  viewHalfWidth: number;
  zoom: number;
};

export function createEntryIntroMovementBounds({
  cameraOffset,
  padding,
  points,
}: CreateEntryIntroMovementBoundsOptions): EntryIntroMovementBounds {
  const axes = getEntryIntroScreenAxes(cameraOffset);
  const acrossValues = points.map((point) => projectOnAxis(point, axes.right));
  const alongValues = points.map((point) => projectOnAxis(point, axes.forward));

  return {
    axes,
    maxAcross: Math.max(...acrossValues) + padding,
    maxAlong: Math.max(...alongValues) + padding,
    minAcross: Math.min(...acrossValues) - padding,
    minAlong: Math.min(...alongValues) - padding,
  };
}

export function getEntryIntroCameraGroundHalfExtent({
  cameraOffset,
  viewHalfHeight,
  viewHalfWidth,
  zoom,
}: GetEntryIntroCameraGroundHalfExtentOptions): EntryIntroScreenExtent {
  const groundDistance = Math.hypot(cameraOffset.x, cameraOffset.z);
  const elevationSin = cameraOffset.y / Math.hypot(groundDistance, cameraOffset.y);

  return {
    across: viewHalfWidth / zoom,
    along: viewHalfHeight / zoom / elevationSin,
  };
}

export function clampEntryIntroMovementPoint(
  point: EntryExplorationScenePoint,
  bounds: EntryIntroMovementBounds,
  characterMargin: EntryIntroScreenExtent
): EntryExplorationScenePoint {
  return clampInsideBounds(point, bounds, characterMargin);
}

export function clampEntryIntroCameraFocus(
  point: EntryExplorationScenePoint,
  bounds: EntryIntroMovementBounds,
  cameraGroundHalfExtent: EntryIntroScreenExtent
): EntryExplorationScenePoint {
  return clampInsideBounds(point, bounds, cameraGroundHalfExtent);
}

function clampInsideBounds(
  point: EntryExplorationScenePoint,
  { axes, maxAcross, maxAlong, minAcross, minAlong }: EntryIntroMovementBounds,
  inset: EntryIntroScreenExtent
): EntryExplorationScenePoint {
  const pointAcross = projectOnAxis(point, axes.right);
  const pointAlong = projectOnAxis(point, axes.forward);
  const across = clampInsideRange(pointAcross, minAcross + inset.across, maxAcross - inset.across);
  const along = clampInsideRange(pointAlong, minAlong + inset.along, maxAlong - inset.along);

  if (across === pointAcross && along === pointAlong) {
    return point;
  }

  return {
    x: axes.right.x * across + axes.forward.x * along,
    z: axes.right.z * across + axes.forward.z * along,
  };
}

function getEntryIntroScreenAxes(cameraOffset: EntryExplorationScenePoint): EntryIntroScreenAxes {
  const length = Math.hypot(cameraOffset.x, cameraOffset.z);
  const forward = { x: cameraOffset.x / length, z: cameraOffset.z / length };

  return { forward, right: { x: forward.z, z: -forward.x } };
}

function projectOnAxis(
  point: EntryExplorationScenePoint,
  axis: EntryExplorationScenePoint
): number {
  return point.x * axis.x + point.z * axis.z;
}

function clampInsideRange(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2;
  }

  return Math.min(Math.max(value, min), max);
}
