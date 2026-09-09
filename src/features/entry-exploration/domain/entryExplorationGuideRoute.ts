import { ENTRY_EXPLORATION_GUIDE_CONFIG as CONFIG } from "../config/entryExplorationGuideConfig";
import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";

type GuideRouteOptions = {
  origin: EntryExplorationScenePoint;
  towerPosition: EntryExplorationScenePoint;
  cameraOffset: EntryExplorationScenePoint & { y: number };
  characterHeight: number;
};

export function createEntryExplorationGuideRoute({
  origin,
  towerPosition,
  cameraOffset,
  characterHeight,
}: GuideRouteOptions) {
  const horizontal = Math.hypot(cameraOffset.x, cameraOffset.z);
  const distance = Math.hypot(horizontal, cameraOffset.y);
  const forward = { x: cameraOffset.x / horizontal, z: cameraOffset.z / horizontal };
  const right = { x: forward.z, z: -forward.x };
  // Put the character below the tower's base in screen space, with room above its head.
  const frontOffset =
    (characterHeight * (horizontal / distance) + CONFIG.characterScreenClearance) /
    (cameraOffset.y / distance);
  const destination = {
    x: towerPosition.x + forward.x * frontOffset - right.x * CONFIG.destinationLeftOffset,
    z: towerPosition.z + forward.z * frontOffset - right.z * CONFIG.destinationLeftOffset,
  };
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
