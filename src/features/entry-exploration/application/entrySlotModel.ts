import * as THREE from "three";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import type { SlotReelAngles } from "../domain/entrySlotSpin";

export function createEntrySlotModel(source: THREE.Object3D) {
  const model = source.clone(true);
  const reels = ENTRY_SLOT_CONFIG.reelNames.map((name) => {
    const reel = model.getObjectByName(name);
    if (!reel) throw new Error(`Slot reel is missing: ${name}`);

    return { object: reel, initialQuaternion: reel.quaternion.clone() };
  });
  const lever = model.getObjectByName(ENTRY_SLOT_CONFIG.lever.name);
  if (!lever) throw new Error(`Slot lever is missing: ${ENTRY_SLOT_CONFIG.lever.name}`);
  const initialLeverQuaternion = lever.quaternion.clone();
  const ownedMaterials: THREE.Material[] = [];
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const cloneMaterial = (material: THREE.Material) => {
      const cloned = material.clone();
      ownedMaterials.push(cloned);

      return cloned;
    };
    child.material = Array.isArray(child.material)
      ? child.material.map(cloneMaterial)
      : cloneMaterial(child.material);
    child.castShadow = true;
  });

  const placement = new THREE.Group();
  placement.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
  placement.scale.setScalar(ENTRY_SLOT_CONFIG.height / size.y);
  const object = new THREE.Group();
  object.add(placement);
  object.rotation.y = ENTRY_SLOT_CONFIG.rotationY;
  const axis = new THREE.Vector3(0, 0, 1);
  const rotation = new THREE.Quaternion();
  let disposed = false;

  return {
    object,
    setLeverAngle(angle: number): void {
      rotation.setFromAxisAngle(axis, angle);
      lever.quaternion.copy(initialLeverQuaternion).multiply(rotation);
    },
    setAngles(angles: SlotReelAngles): void {
      reels.forEach((reel, index) => {
        rotation.setFromAxisAngle(axis, angles[index]);
        reel.object.quaternion.copy(reel.initialQuaternion).multiply(rotation);
      });
    },
    setStopFeedback(offset: number): void {
      object.position.z = offset * ENTRY_SLOT_CONFIG.stopFeedbackDistance;
    },
    setEnvironment(texture: THREE.Texture): void {
      ownedMaterials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.envMap = texture;
        material.envMapIntensity = 0.7;
        material.needsUpdate = true;
      });
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      ownedMaterials.forEach((material) => material.dispose());
      object.clear();
    },
  };
}
