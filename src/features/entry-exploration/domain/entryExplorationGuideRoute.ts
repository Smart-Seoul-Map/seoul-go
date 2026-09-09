import { ENTRY_EXPLORATION_GUIDE_CONFIG as CONFIG } from "../config/entryExplorationGuideConfig";
import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";

type GuideRouteOptions = {
  origin: EntryExplorationScenePoint;
  towerPosition: EntryExplorationScenePoint;
  cameraOffset: EntryExplorationScenePoint & { y: number };
};

export function createEntryExplorationGuideRoute({
  origin,
  towerPosition,
  cameraOffset,
}: GuideRouteOptions) {
  const horizontal = Math.hypot(cameraOffset.x, cameraOffset.z);
  const forward = { x: cameraOffset.x / horizontal, z: cameraOffset.z / horizontal };
  const right = { x: forward.z, z: -forward.x };
  const destination = { x: towerPosition.x, z: towerPosition.z };
  const localEnd = { x: destination.x - origin.x, z: destination.z - origin.z };
  const endRight = localEnd.x * right.x + localEnd.z * right.z;
  const endForward = localEnd.x * forward.x + localEnd.z * forward.z;
  const turnDirection = Math.sign(endRight) || 1;
  const radius = Math.min(
    CONFIG.bendRadius,
    Math.abs(endRight) * 0.65,
    Math.max(0, endForward - CONFIG.startForwardOffset) * 0.35
  );
  const toWorld = (rightDistance: number, forwardDistance: number): EntryExplorationScenePoint => ({
    x: origin.x + right.x * rightDistance + forward.x * forwardDistance,
    z: origin.z + right.z * rightDistance + forward.z * forwardDistance,
  });

  return {
    start: toWorld(0, CONFIG.startForwardOffset),
    bendStart: toWorld(0, endForward - radius),
    bendControl: toWorld(0, endForward),
    bendEnd: toWorld(turnDirection * radius, endForward),
    destination,
  };
}
