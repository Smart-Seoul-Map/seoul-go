import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import {
  ENTRY_INTRO_LAYOUT_VIEWPORTS,
  type EntryIntroLayout,
  type EntryIntroLayoutObjectId,
  type EntryIntroLayouts,
} from "../config/entryIntroLayout";
import {
  interpolateEntryExplorationScenePoint,
  type EntryExplorationScenePoint,
} from "./entryExplorationSceneMath";

const EDITION_FIRST_PLACE_SCREEN_RATIO = 0.45;

export function getEntryIntroLayoutBlend(aspect: number): number {
  const { mobile, pc } = ENTRY_INTRO_LAYOUT_VIEWPORTS;
  const mobileAspect = mobile.width / mobile.height;
  const pcAspect = pc.width / pc.height;
  const blend = (aspect - mobileAspect) / (pcAspect - mobileAspect);

  return Math.min(Math.max(blend, 0), 1);
}

export function resolveEntryIntroLayout(
  layouts: EntryIntroLayouts,
  aspect: number
): EntryIntroLayout {
  const { mobile, pc } = layouts;
  const blend = getEntryIntroLayoutBlend(aspect);
  const objectIds = Object.keys(pc.objects) as EntryIntroLayoutObjectId[];
  const objects = { ...pc.objects };
  objectIds.forEach((id) => {
    objects[id] = interpolateEntryExplorationScenePoint(mobile.objects[id], pc.objects[id], blend);
  });
  const edition = pc.edition.map((point, index) =>
    interpolateEntryExplorationScenePoint(mobile.edition[index], point, blend)
  );

  return {
    edition: keepFirstEditionPlaceOnScreen(edition, aspect),
    objects,
  };
}

export function keepFirstEditionPlaceOnScreen(
  edition: readonly EntryExplorationScenePoint[],
  aspect: number
): readonly EntryExplorationScenePoint[] {
  const { cameraOffset, cameraViewSize, intro } = ENTRY_EXPLORATION_SCENE_CONFIG;
  const length = Math.hypot(cameraOffset.x, cameraOffset.z);
  const forward = { x: cameraOffset.x / length, z: cameraOffset.z / length };
  const right = { x: forward.z, z: -forward.x };
  const first = edition[0];
  const across =
    (first.x - intro.targetPosition.x) * right.x + (first.z - intro.targetPosition.z) * right.z;
  const maxAcross = cameraViewSize * aspect * EDITION_FIRST_PLACE_SCREEN_RATIO;
  const clampedAcross = Math.min(Math.max(across, -maxAcross), maxAcross);
  const shiftRight = clampedAcross - across;
  const shiftForward = Math.abs(across) - Math.abs(clampedAcross);

  return edition.map((point) => ({
    x: point.x + right.x * shiftRight + forward.x * shiftForward,
    z: point.z + right.z * shiftRight + forward.z * shiftForward,
  }));
}
