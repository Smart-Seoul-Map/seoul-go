import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../../src/features/entry-exploration/config/entryExplorationSceneConfig";
import {
  ENTRY_INTRO_LAYOUT_VIEWPORTS,
  type EntryIntroLayoutDocument,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import { decomposeEntryIntroLayoutPlacement } from "../../src/features/entry-exploration/domain/entryIntroLayout";
import type { EntryExplorationScenePoint } from "../../src/features/entry-exploration/domain/entryExplorationSceneMath";
import { getIntroLayoutParent, getIntroLayoutWorld, setIntroLayoutLocal } from "./introLayoutTree";

function getHorizontalScale(): number {
  const { mobile, pc } = ENTRY_INTRO_LAYOUT_VIEWPORTS;

  return mobile.width / mobile.height / (pc.width / pc.height);
}

function squeezeHorizontally(
  point: EntryExplorationScenePoint,
  scale: number
): EntryExplorationScenePoint {
  const { cameraOffset, intro } = ENTRY_EXPLORATION_SCENE_CONFIG;
  const length = Math.hypot(cameraOffset.x, cameraOffset.z);
  const forward = { x: cameraOffset.x / length, z: cameraOffset.z / length };
  const right = { x: forward.z, z: -forward.x };
  const dx = point.x - intro.targetPosition.x;
  const dz = point.z - intro.targetPosition.z;
  const across = (dx * right.x + dz * right.z) * scale;
  const ahead = dx * forward.x + dz * forward.z;

  return {
    x: intro.targetPosition.x + right.x * across + forward.x * ahead,
    z: intro.targetPosition.z + right.z * across + forward.z * ahead,
  };
}

export function createMobileLayoutFromPc(
  document: EntryIntroLayoutDocument
): EntryIntroLayoutDocument {
  const scale = getHorizontalScale();
  const world = new Map(
    [...getIntroLayoutWorld(document, "pc")].map(([id, placement]) => [
      id,
      { ...placement, ...squeezeHorizontally(placement, scale) },
    ])
  );

  return [...world].reduce((current, [id, placement]) => {
    const parentId = getIntroLayoutParent(document, id);
    const parentWorld = parentId ? world.get(parentId) : undefined;
    const local = parentWorld
      ? decomposeEntryIntroLayoutPlacement(parentWorld, placement)
      : placement;

    return setIntroLayoutLocal(current, "mobile", id, local);
  }, document);
}
