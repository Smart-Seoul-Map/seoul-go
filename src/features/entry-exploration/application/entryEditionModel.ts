import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import type { EntryEditionModel } from "../config/entryEditionModels";

export function createEntryEditionModel(source: THREE.Object3D, asset: EntryEditionModel) {
  const object = new THREE.Group();
  const model = clone(source);
  model.rotation.y += asset.rotationY;
  object.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const longestSide = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(longestSide) || longestSide <= 0)
    throw new Error("Empty entry place model.");
  const scale = asset.size / longestSide;
  const center = bounds.getCenter(new THREE.Vector3());
  object.scale.setScalar(scale);
  model.position.x -= center.x;
  model.position.y -= bounds.min.y;
  model.position.z -= center.z;
  model.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return {
    object,
    dispose(): void {
      object.removeFromParent();
      // Cached GLB materials, textures and geometry remain owned by the loader.
      model.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose();
      });
      object.clear();
    },
  };
}
