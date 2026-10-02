import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

export type ModelInstanceOptions = {
  /** Longest bounding-box side after rotation, in the consumer's scene units. */
  size: number;
  rotation?: { x: number; y: number; z: number };
};

export type ModelInstance = {
  object: THREE.Group;
  dispose: () => void;
};

export function createModelInstance(
  source: THREE.Object3D,
  { size, rotation }: ModelInstanceOptions
): ModelInstance {
  if (!Number.isFinite(size) || size <= 0)
    throw new Error("Model size must be positive and finite.");
  if (rotation && ![rotation.x, rotation.y, rotation.z].every(Number.isFinite)) {
    throw new Error("Model rotation must be finite.");
  }

  const object = new THREE.Group();
  const placement = new THREE.Group();
  const model = clone(source);
  placement.add(model);
  if (rotation) placement.rotation.set(rotation.x, rotation.y, rotation.z);
  object.add(placement);
  const materials = new Map<THREE.Material, THREE.Material>();
  const skeletons = new Set<THREE.Skeleton>();
  let disposed = false;

  const cloneMaterial = (material: THREE.Material): THREE.Material => {
    const existing = materials.get(material);
    if (existing) return existing;
    const cloned = material.clone();
    materials.set(material, cloned);

    return cloned;
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    object.removeFromParent();
    object.clear();
    // Geometry and textures belong to the cached source, not this placement.
    materials.forEach((material) => material.dispose());
    skeletons.forEach((skeleton) => skeleton.dispose());
    materials.clear();
    skeletons.clear();
  };

  try {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (child instanceof THREE.SkinnedMesh) skeletons.add(child.skeleton);
      child.material = Array.isArray(child.material)
        ? child.material.map(cloneMaterial)
        : cloneMaterial(child.material);
    });
    const bounds = new THREE.Box3().setFromObject(placement);
    const dimensions = bounds.getSize(new THREE.Vector3());
    const longestSide = Math.max(dimensions.x, dimensions.y, dimensions.z);
    if (bounds.isEmpty() || !Number.isFinite(longestSide) || longestSide <= 0) {
      throw new Error("Model must have finite, non-empty bounds.");
    }
    const scale = size / longestSide;
    const center = bounds.getCenter(new THREE.Vector3());
    placement.scale.setScalar(scale);
    placement.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    object.updateMatrixWorld(true);
  } catch (error) {
    dispose();
    throw error;
  }

  return { object, dispose };
}
