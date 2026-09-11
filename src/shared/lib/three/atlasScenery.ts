import * as THREE from "three";

import { createAtlasPlaneGeometry, type TextureAtlasFrame } from "./textureAtlas";

export type AtlasPlacement<Key extends string = string> = {
  name: string;
  key: Key;
  width: number;
  position: { x: number; y: number; z: number };
};

export type AtlasSceneryOptions<Key extends string = string> = {
  atlasUrl: string;
  manifest: {
    frames: Record<Key, TextureAtlasFrame>;
    size: { width: number; height: number };
  };
  placements: readonly AtlasPlacement<Key>[];
  facing: THREE.Quaternion;
  name?: string;
  onLoadError?: (error: unknown) => void;
};

export function createAtlasScenery<Key extends string>({
  atlasUrl,
  manifest,
  placements,
  facing,
  name = "atlas-scenery",
  onLoadError,
}: AtlasSceneryOptions<Key>) {
  const object = new THREE.Group();
  object.name = name;
  const material = new THREE.MeshBasicMaterial({
    alphaTest: 0.08,
    transparent: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const geometries: THREE.PlaneGeometry[] = [];

  try {
    for (const placement of placements) {
      const frame = manifest.frames[placement.key];
      if (!frame) {
        throw new Error(`Unknown atlas frame: ${placement.key}`);
      }
      const geometry = createAtlasPlaneGeometry(frame, manifest.size, placement.width);
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = placement.name;
      mesh.position.copy(placement.position);
      mesh.quaternion.copy(facing);
      object.add(mesh);
    }
  } catch (error) {
    geometries.forEach((geometry) => geometry.dispose());
    material.dispose();
    throw error;
  }

  let isDisposed = false;
  const texture = new THREE.TextureLoader().load(atlasUrl, undefined, undefined, (error) => {
    if (isDisposed) return;
    object.visible = false;
    onLoadError?.(error);
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  // Tight atlas packing must not sample neighbouring frames through mipmaps.
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  material.map = texture;

  return {
    object,
    dispose(): void {
      if (isDisposed) return;
      isDisposed = true;
      object.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      texture.dispose();
    },
  };
}
