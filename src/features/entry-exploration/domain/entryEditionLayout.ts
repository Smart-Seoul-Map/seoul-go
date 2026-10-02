import { ENTRY_EXPLORATION_GUIDE_CONFIG } from "../config/entryExplorationGuideConfig";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";

const PLACE_SPACING = 12;
const PLACES_PER_COLUMN = 2;

export function getEntryEditionPosition(index: number, aspect: number): EntryExplorationScenePoint {
  const { cameraOffset, cameraViewSize, characterSpeedPerSecond, intro } =
    ENTRY_EXPLORATION_SCENE_CONFIG;
  const length = Math.hypot(cameraOffset.x, cameraOffset.z);
  const forward = { x: cameraOffset.x / length, z: cameraOffset.z / length };
  const right = { x: forward.z, z: -forward.x };
  const guide = ENTRY_EXPLORATION_GUIDE_CONFIG;
  const travel = characterSpeedPerSecond * guide.targetTravelSeconds;
  const firstRight = Math.min(
    cameraViewSize * aspect * 0.45,
    travel - guide.startForwardOffset - guide.bendRadius
  );
  const across = firstRight + Math.floor(index / PLACES_PER_COLUMN) * PLACE_SPACING;
  const ahead = travel - Math.abs(firstRight) + (index % PLACES_PER_COLUMN) * PLACE_SPACING;

  return {
    x: intro.targetPosition.x + right.x * across + forward.x * ahead,
    z: intro.targetPosition.z + right.z * across + forward.z * ahead,
  };
}
