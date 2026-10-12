import * as THREE from "three";

import { createAtlasScenery } from "@shared/lib/three/atlasScenery";

import manifest from "../../../assets/entry-exploration/intro-atlas.json";
import atlasUrl from "../../../assets/entry-exploration/intro-atlas.png";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "../config/entryExplorationSceneryObjects";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import type { EntryIntroLayout } from "../config/entryIntroLayout";

export function createEntryExplorationScenery() {
  const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;
  const facing = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(
      new THREE.Vector3(cameraOffset.x, cameraOffset.y, cameraOffset.z),
      new THREE.Vector3(),
      new THREE.Vector3(0, 1, 0)
    )
  );
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
        const point = layout.objects[key];
        const sprite = scenery.object.getObjectByName(`entry-scenery-${key}`);

        sprite?.position.setX(point.x).setZ(point.z);
      });
    },
  };
}
