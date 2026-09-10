import * as THREE from "three";

import { createAtlasPlaneGeometry } from "@shared/lib/three/textureAtlas";

import manifest from "../../../assets/entry-exploration/intro-atlas.json";
import atlasUrl from "../../../assets/entry-exploration/intro-atlas.png";
import { ENTRY_EXPLORATION_ATLAS_OBJECTS } from "../config/entryExplorationAtlasObjects";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";

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
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      texture.dispose();
    },
  };
}
