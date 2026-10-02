import * as THREE from "three";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { getCameraFacingFloorOverlayRotationY } from "./entryExplorationThreeScene";

const INTRO_FLOOR_CONFIG = {
  introBackground: {
    depth: 12.375,
    position: {
      x: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition.x - 7.2 / Math.SQRT2,
      z: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition.z - 7.2 / Math.SQRT2,
    },
    width: 22,
    yOffset: 0.05,
  },
} as const;

const textureLoader = new THREE.TextureLoader();

export type EntryExplorationIntroFloor = {
  object: THREE.Group;
};

export function createEntryExplorationIntroFloor(): EntryExplorationIntroFloor {
  const object = new THREE.Group();
  const introBackgroundMesh = createIntroBackgroundMesh();

  object.add(introBackgroundMesh);

  return {
    object,
  };
}

function createIntroBackgroundMesh(): THREE.Mesh {
  const texture = textureLoader.load(ENTRY_EXPLORATION_TEXTURE_ASSETS.introBackground.src);
  texture.colorSpace = THREE.SRGBColorSpace;

  return createFloorPlaneMesh({
    depth: INTRO_FLOOR_CONFIG.introBackground.depth,
    material: new THREE.MeshBasicMaterial({
      alphaTest: 0.02,
      depthWrite: false,
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    position: INTRO_FLOOR_CONFIG.introBackground.position,
    width: INTRO_FLOOR_CONFIG.introBackground.width,
    yOffset: INTRO_FLOOR_CONFIG.introBackground.yOffset,
  });
}

function createFloorPlaneMesh({
  depth,
  material,
  position,
  width,
  yOffset,
}: {
  depth: number;
  material: THREE.Material;
  position: { x: number; z: number };
  width: number;
  yOffset: number;
}): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(position.x, yOffset, position.z);
  mesh.rotation.set(-Math.PI / 2, 0, getCameraFacingFloorOverlayRotationY());

  return mesh;
}
