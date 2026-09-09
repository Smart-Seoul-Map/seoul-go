import * as THREE from "three";

import { createAtlasPlaneGeometry } from "@shared/lib/three/textureAtlas";

import manifest from "../../../assets/entry-exploration/intro-atlas.json";
import atlasUrl from "../../../assets/entry-exploration/intro-atlas.png";
import {
  ENTRY_EXPLORATION_ATLAS_OBJECTS,
  ENTRY_EXPLORATION_TOWER_ENTRY_VIEWPORT_X,
} from "../config/entryExplorationAtlasObjects";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";

export function createEntryExplorationAtlasScenery() {
  const object = new THREE.Group();
  object.name = "entry-atlas-scenery";
  const texture = new THREE.TextureLoader().load(atlasUrl, undefined, undefined, () => {
    object.visible = false;
    console.warn("Entry scenery atlas could not be loaded.");
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  // The supplied atlas has tight packing, so avoid mip levels bleeding adjacent frames.
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    alphaTest: 0.08,
    transparent: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const { intro, cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;
  const facing = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(
      new THREE.Vector3(cameraOffset.x, cameraOffset.y, cameraOffset.z),
      new THREE.Vector3(),
      new THREE.Vector3(0, 1, 0)
    )
  );
  const geometries: THREE.PlaneGeometry[] = [];
  for (const placement of ENTRY_EXPLORATION_ATLAS_OBJECTS) {
    const geometry = createAtlasPlaneGeometry(
      manifest.frames[placement.key],
      manifest.size,
      placement.width
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `entry-atlas-${placement.key}`;
    mesh.position.set(
      intro.targetPosition.x + placement.offset.x,
      0.06,
      intro.targetPosition.z + placement.offset.z
    );
    // Preserve the artist's baked isometric perspective without flattening it again.
    mesh.quaternion.copy(facing);
    object.add(mesh);
    geometries.push(geometry);
  }

  return {
    object,
    positionTowerAtEntry(viewportAspect: number): EntryExplorationScenePoint | null {
      const tower = object.getObjectByName("entry-atlas-tower");
      if (!tower) {
        return null;
      }

      // Move along camera-right only, preserving the tower's bottom-edge reveal and scale.
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(facing);
      const offset = tower.position
        .clone()
        .sub(new THREE.Vector3(intro.targetPosition.x, 0, intro.targetPosition.z));
      const halfWidth = (ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize / 2) * viewportAspect;
      const targetRight = (ENTRY_EXPLORATION_TOWER_ENTRY_VIEWPORT_X * 2 - 1) * halfWidth;
      tower.position.addScaledVector(right, targetRight - offset.dot(right));

      return { x: tower.position.x, z: tower.position.z };
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      texture.dispose();
    },
  };
}
