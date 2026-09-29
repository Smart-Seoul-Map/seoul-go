import * as THREE from "three";
import { describe, expect, test } from "vitest";

import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";

import { createEntrySlotPresentation } from "./entrySlotPresentation";

describe("slot character orientation", () => {
  test.each([-Math.PI, -2.3, -1.2, 0, 1.2, 2.3, Math.PI])(
    "preserves walking direction after restoring heading %s",
    (heading) => {
      const character = new THREE.Group();
      character.rotation.y = toCharacterModelRotationRadians(heading);
      const originalRotation = character.rotation.clone();
      const presentation = createEntrySlotPresentation(
        new THREE.Group(),
        new THREE.Vector3(0, 0, 1)
      );
      presentation.setCharacter(character);
      presentation.show([new THREE.Vector3()]);
      presentation.restore();

      expect(character.rotation.x).toBeCloseTo(originalRotation.x);
      expect(character.rotation.y).toBeCloseTo(originalRotation.y);
      expect(character.rotation.z).toBeCloseTo(originalRotation.z);
      expect(character.rotation.order).toBe(originalRotation.order);

      // Movement updates only the Y axis, so restoring must not introduce X/Z rotations.
      for (const nextHeading of [-2.6, -0.4, 0, 0.7, 2.6]) {
        character.rotation.y = toCharacterModelRotationRadians(nextHeading);
        const expectedRotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, toCharacterModelRotationRadians(nextHeading), 0)
        );
        expect(character.quaternion.angleTo(expectedRotation)).toBeLessThan(1e-7);

        presentation.show([new THREE.Vector3()]);
        presentation.restore();
        expect(character.rotation.x).toBe(0);
        expect(character.rotation.z).toBe(0);
        expect(character.quaternion.angleTo(expectedRotation)).toBeLessThan(1e-7);
      }
    }
  );
});
