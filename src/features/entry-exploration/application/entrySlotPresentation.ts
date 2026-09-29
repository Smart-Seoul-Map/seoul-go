import * as THREE from "three";

import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import { getEntryExplorationSceneHeadingRadians } from "../domain/entryExplorationSceneMath";

export function createEntrySlotPresentation(slot: THREE.Object3D, front: THREE.Vector3) {
  let character: THREE.Object3D | null = null;
  let surroundings: readonly THREE.Object3D[] = [];
  let restorePresentation: (() => void) | null = null;
  const right = new THREE.Vector3(front.z, 0, -front.x);

  const restore = () => {
    restorePresentation?.();
    restorePresentation = null;
  };

  return {
    setCharacter(value: THREE.Object3D | null) {
      character = value;
    },
    setSurroundings(objects: readonly THREE.Object3D[]) {
      surroundings = objects;
    },
    show(slotPoints: readonly THREE.Vector3[]): THREE.Vector3[] {
      restore();
      const visibility = surroundings.map((object) => ({ object, visible: object.visible }));
      visibility.forEach(({ object }) => {
        object.visible = false;
      });
      const model = character;
      const original = model
        ? {
            position: model.position.clone(),
            rotation: model.rotation.clone(),
            visible: model.visible,
          }
        : null;
      restorePresentation = () => {
        visibility.forEach(({ object, visible }) => {
          object.visible = visible;
        });
        if (!model || !original) return;
        model.position.copy(original.position);
        // Walking changes only rotation.y; preserve the original Euler axes as well.
        model.rotation.copy(original.rotation);
        model.visible = original.visible;
        model.updateMatrixWorld(true);
      };
      if (!model) return [...slotPoints];

      const { characterGap, characterForwardOffset, characterFacingForwardRatio } =
        ENTRY_SLOT_CONFIG.presentation;
      model.position.copy(slot.position).addScaledVector(front, characterForwardOffset);
      const facingPoint = model.position
        .clone()
        .add(right)
        .addScaledVector(front, characterFacingForwardRatio);
      model.rotation.y = toCharacterModelRotationRadians(
        getEntryExplorationSceneHeadingRadians(model.position, facingPoint)
      );
      model.visible = true;
      model.updateMatrixWorld(true);
      const characterPoints = getSlotPresentationPoints(model);
      if (characterPoints.length === 0) return [...slotPoints];

      const slotLeft = Math.min(...slotPoints.map((point) => point.dot(right)));
      const characterRight = Math.max(...characterPoints.map((point) => point.dot(right)));
      const offset = right.clone().multiplyScalar(slotLeft - characterRight - characterGap);
      model.position.add(offset);
      model.updateMatrixWorld(true);

      return [...slotPoints, ...characterPoints.map((point) => point.add(offset))];
    },
    restore,
  };
}

export function getSlotPresentationPoints(object: THREE.Object3D): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child instanceof THREE.SkinnedMesh) child.computeBoundingBox();
    else child.geometry.computeBoundingBox();
    const bounds =
      child instanceof THREE.SkinnedMesh ? child.boundingBox : child.geometry.boundingBox;
    if (!bounds || bounds.isEmpty()) return;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          points.push(new THREE.Vector3(x, y, z).applyMatrix4(child.matrixWorld));
  });
  return points;
}
