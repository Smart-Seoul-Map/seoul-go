export type EntryExplorationScenePoint = {
  x: number;
  z: number;
};

const FULL_CIRCLE_RADIANS = Math.PI * 2;

function normalizeRadians(radians: number): number {
  return (
    ((((radians + Math.PI) % FULL_CIRCLE_RADIANS) + FULL_CIRCLE_RADIANS) % FULL_CIRCLE_RADIANS) -
    Math.PI
  );
}

export function getEntryExplorationSceneDistance(
  from: EntryExplorationScenePoint,
  to: EntryExplorationScenePoint
): number {
  return Math.hypot(to.x - from.x, to.z - from.z);
}

export function interpolateEntryExplorationScenePoint(
  from: EntryExplorationScenePoint,
  to: EntryExplorationScenePoint,
  ratio: number
): EntryExplorationScenePoint {
  return {
    x: from.x + (to.x - from.x) * ratio,
    z: from.z + (to.z - from.z) * ratio,
  };
}

export function getEntryExplorationSceneHeadingRadians(
  from: EntryExplorationScenePoint,
  to: EntryExplorationScenePoint
): number {
  const deltaX = to.x - from.x;
  const deltaZ = to.z - from.z;

  if (deltaX === 0 && deltaZ === 0) {
    return 0;
  }

  return normalizeRadians(-Math.atan2(deltaX, deltaZ));
}
