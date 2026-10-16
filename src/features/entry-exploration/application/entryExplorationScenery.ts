import * as THREE from "three";

import { createAtlasScenery } from "@shared/lib/three/atlasScenery";

import manifest from "../../../assets/entry-exploration/intro-atlas.json";
import atlasUrl from "../../../assets/entry-exploration/intro-atlas.png";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "../config/entryExplorationSceneryObjects";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import type { EntryIntroLayout, EntryIntroLayoutPlacement } from "../config/entryIntroLayout";

const DEGREES_TO_RADIANS = Math.PI / 180;
const SCREEN_AXIS = new THREE.Vector3(0, 0, 1);

export function createEntryExplorationFacing(): THREE.Quaternion {
  const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;

  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(
      new THREE.Vector3(cameraOffset.x, cameraOffset.y, cameraOffset.z),
      new THREE.Vector3(),
      new THREE.Vector3(0, 1, 0)
    )
  );
}

export function placeEntryExplorationStandingObject(
  object: THREE.Object3D,
  facing: THREE.Quaternion,
  placement: EntryIntroLayoutPlacement
): void {
  object.position.setX(placement.x).setZ(placement.z);
  object.scale.setScalar(placement.scale);
  object.quaternion
    .copy(facing)
    .multiply(
      new THREE.Quaternion().setFromAxisAngle(SCREEN_AXIS, placement.rotation * DEGREES_TO_RADIANS)
    );
}

export function createEntryExplorationScenery() {
  const facing = createEntryExplorationFacing();
  const scenery = createAtlasScenery({
    atlasUrl,
    manifest,
    facing,
    name: "entry-scenery",
    placements: ENTRY_EXPLORATION_SCENERY_OBJECTS.map((placement) => ({
      key: placement.key,
      name: `entry-scenery-${placement.key}`,
      width: placement.width,
      position: { x: 0, y: 0.06, z: 0 },
    })),
    onLoadError: () => console.warn("Entry scenery atlas could not be loaded."),
  });

  return {
    ...scenery,
    applyLayout(layout: EntryIntroLayout): void {
      ENTRY_EXPLORATION_SCENERY_OBJECTS.forEach(({ key }) => {
        const sprite = scenery.object.getObjectByName(`entry-scenery-${key}`);

        if (sprite) placeEntryExplorationStandingObject(sprite, facing, layout.objects[key]);
      });
    },
  };
}
