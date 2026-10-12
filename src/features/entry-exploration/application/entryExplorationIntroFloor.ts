import * as THREE from "three";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import type { EntryIntroLayout } from "../config/entryIntroLayout";
import { getCameraFacingFloorOverlayRotationY } from "./entryExplorationThreeScene";

const INTRO_FLOOR_CONFIG = {
  introBackground: {
    depth: 12.375,
    viewWidthRatio: 0.91,
    width: 22,
    yOffset: 0.05,
  },
} as const;

const textureLoader = new THREE.TextureLoader();

export type EntryExplorationIntroFloor = {
  object: THREE.Group;
  applyLayout: (layout: EntryIntroLayout, aspect: number) => void;
};

export function getIntroBackgroundWidth(aspect: number): number {
  const { viewWidthRatio, width } = INTRO_FLOOR_CONFIG.introBackground;

  return Math.min(width, ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize * aspect * viewWidthRatio);
}

export function createEntryExplorationIntroFloor(): EntryExplorationIntroFloor {
  const object = new THREE.Group();
  const introBackgroundMesh = createIntroBackgroundMesh();

  object.add(introBackgroundMesh);

  return {
    object,
    applyLayout(layout, aspect) {
      const point = layout.objects["intro-background"];

      introBackgroundMesh.position.setX(point.x).setZ(point.z);
      introBackgroundMesh.scale.setScalar(
        getIntroBackgroundWidth(aspect) / INTRO_FLOOR_CONFIG.introBackground.width
      );
    },
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
    width: INTRO_FLOOR_CONFIG.introBackground.width,
    yOffset: INTRO_FLOOR_CONFIG.introBackground.yOffset,
  });
}

function createFloorPlaneMesh({
  depth,
  material,
  width,
  yOffset,
}: {
  depth: number;
  material: THREE.Material;
  width: number;
  yOffset: number;
}): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.y = yOffset;
  mesh.rotation.set(-Math.PI / 2, 0, getCameraFacingFloorOverlayRotationY());

  return mesh;
}
