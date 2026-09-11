import * as THREE from "three";

import { createAtlasScenery } from "@shared/lib/three/atlasScenery";

import manifest from "../../../assets/entry-exploration/intro-atlas.json";
import atlasUrl from "../../../assets/entry-exploration/intro-atlas.png";
import {
  ENTRY_EXPLORATION_LANDMARK_LAYOUT,
  ENTRY_EXPLORATION_SCENERY_OBJECTS,
} from "../config/entryExplorationSceneryObjects";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { ENTRY_EXPLORATION_GUIDE_CONFIG } from "../config/entryExplorationGuideConfig";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";

export function createEntryExplorationScenery() {
  const { intro, cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;
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
      position: {
        x: intro.targetPosition.x + placement.offset.x,
        y: 0.06,
        z: intro.targetPosition.z + placement.offset.z,
      },
    })),
    onLoadError: () => console.warn("Entry scenery atlas could not be loaded."),
  });
  const { object } = scenery;

  return {
    object,
    positionLandmarksAtEntry(viewportAspect: number): EntryExplorationScenePoint | null {
      const hanok = object.getObjectByName("entry-scenery-hanok");
      const tower = object.getObjectByName("entry-scenery-tower");
      if (!hanok || !tower) {
        return null;
      }

      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(facing);
      const forward = new THREE.Vector3(cameraOffset.x, 0, cameraOffset.z).normalize();
      const halfWidth = (ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize / 2) * viewportAspect;
      const layout = ENTRY_EXPLORATION_LANDMARK_LAYOUT;
      const targetRight = (layout.hanokEntryViewportX * 2 - 1) * halfWidth;
      // Bound the two legs of the L route; rounding the corner makes travel slightly shorter.
      const travelDistance =
        ENTRY_EXPLORATION_SCENE_CONFIG.characterSpeedPerSecond *
        ENTRY_EXPLORATION_GUIDE_CONFIG.targetTravelSeconds;
      const endRight = Math.min(
        targetRight,
        travelDistance -
          ENTRY_EXPLORATION_GUIDE_CONFIG.startForwardOffset -
          ENTRY_EXPLORATION_GUIDE_CONFIG.bendRadius
      );
      const endForward = travelDistance - Math.abs(endRight);
      hanok.position
        .set(intro.targetPosition.x, 0.06, intro.targetPosition.z)
        .addScaledVector(right, endRight)
        .addScaledVector(forward, endForward);

      // Reveal the tower from the right during the approach, below the hanok's screen bounds.
      tower.position
        .set(intro.targetPosition.x, 0.06, intro.targetPosition.z)
        .addScaledVector(right, halfWidth + layout.towerEntryEdgeOffset)
        .addScaledVector(forward, endForward + layout.towerForwardOffset);

      return { x: hanok.position.x, z: hanok.position.z };
    },
    dispose: scenery.dispose,
  };
}
