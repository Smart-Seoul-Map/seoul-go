import * as THREE from "three";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import type { SlotReelAngles } from "../domain/entrySlotSpin";
import { getEntryExplorationIntroTheme } from "./entryExplorationIntroTheme";

export function createEntrySlotModel(source: THREE.Object3D) {
  const model = source.clone(true);
  const reels = ENTRY_SLOT_CONFIG.reelNames.map((name) => {
    const reel = model.getObjectByName(name);
    if (!reel) throw new Error(`Slot reel is missing: ${name}`);

    return { object: reel, initialQuaternion: reel.quaternion.clone() };
  });
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

  const selection = new THREE.Group();
  selection.name = "slot-selection-line";
  selection.visible = false;
  const selectionPlane = new THREE.PlaneGeometry(
    ENTRY_SLOT_CONFIG.selection.width,
    ENTRY_SLOT_CONFIG.selection.height
  );
  const selectionGeometry = new THREE.EdgesGeometry(selectionPlane);
  selectionPlane.dispose();
  const selectionMaterial = new THREE.LineBasicMaterial({
    color: getEntryExplorationIntroTheme().guideColor,
    depthTest: false,
  });
  for (const index of [0, 2]) {
    const bounds = new THREE.Box3().setFromObject(reels[index].object);
    const center = bounds.getCenter(new THREE.Vector3());
    const frame = new THREE.LineSegments(selectionGeometry, selectionMaterial);
    frame.rotation.y = Math.PI / 2;
    frame.position.set(bounds.max.x + ENTRY_SLOT_CONFIG.selection.frontOffset, center.y, center.z);
    frame.renderOrder = 1;
    selection.add(frame);
  }
  model.add(selection);

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
    setAngles(angles: SlotReelAngles): void {
      reels.forEach((reel, index) => {
        rotation.setFromAxisAngle(axis, angles[index]);
        reel.object.quaternion.copy(reel.initialQuaternion).multiply(rotation);
      });
    },
    setSelectionVisible(visible: boolean): void {
      selection.visible = visible;
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
      selectionGeometry.dispose();
      selectionMaterial.dispose();
      object.clear();
    },
  };
}
