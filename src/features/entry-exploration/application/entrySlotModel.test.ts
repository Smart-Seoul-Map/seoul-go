import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import { createEntrySlotModel } from "./entrySlotModel";

function sourceModel() {
  const source = new THREE.Group();
  for (const [name, z] of [
    ["slot", 0],
    ["slot_lever", -3],
    ["slot_number_2", 2],
    ["slot_logo", 0],
    ["slot_number_1", -2],
  ] as const) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial());
    mesh.name = name;
    mesh.position.set(4, 10, z);
    mesh.rotation.z = -Math.PI / 2;
    source.add(mesh);
  }
  return source;
}

describe("entry slot model", () => {
  test("uses the existing intro accent token for the selection line", () => {
    document.documentElement.style.setProperty("--sg-v3-pink-500", "#123456");
    const model = createEntrySlotModel(sourceModel());
    try {
      const marker = model.object.getObjectByName("slot-selection-line")
        ?.children[0] as THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
      expect(marker.material.color.getHexString()).toBe("123456");
    } finally {
      model.dispose();
      document.documentElement.style.removeProperty("--sg-v3-pink-500");
    }
  });
  test("grounds and scales the wrapper, preserving the model pivots", () => {
    const source = sourceModel();
    const model = createEntrySlotModel(source);
    const bounds = new THREE.Box3().setFromObject(model.object);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(bounds.max.y).toBeCloseTo(3.6);
    expect(model.object.getObjectByName("slot_number_2")?.position.toArray()).toEqual([4, 10, 2]);
    expect(source.position.toArray()).toEqual([0, 0, 0]);
    model.dispose();
  });

  test("turns only the reels around local Z in left/center/right order without mutating the source", () => {
    const source = sourceModel();
    const model = createEntrySlotModel(source);
    model.setAngles([Math.PI / 2, Math.PI, (54 * Math.PI) / 180]);
    expect(
      model.object.getObjectByName("slot_number_2")?.quaternion.angleTo(new THREE.Quaternion())
    ).toBeCloseTo(0);
    expect(model.object.getObjectByName("slot_number_1")?.rotation.z).toBeCloseTo(
      (-36 * Math.PI) / 180
    );
    expect(model.object.getObjectByName("slot")?.quaternion.toArray()).toEqual(
      source.getObjectByName("slot")?.quaternion.toArray()
    );
    expect(model.object.getObjectByName("slot_lever")?.quaternion.toArray()).toEqual(
      source.getObjectByName("slot_lever")?.quaternion.toArray()
    );
    expect(source.getObjectByName("slot_number_2")?.rotation.z).toBeCloseTo(-Math.PI / 2);
    model.dispose();
  });

  test("disposes owned materials without disposing cached geometry or textures", () => {
    const source = sourceModel();
    const original = source.children[0] as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshStandardMaterial
    >;
    original.material.map = new THREE.Texture();
    const geometryDispose = vi.spyOn(original.geometry, "dispose");
    const textureDispose = vi.spyOn(original.material.map, "dispose");
    const sourceDispose = vi.spyOn(original.material, "dispose");
    const model = createEntrySlotModel(source);
    const clone = model.object.getObjectByName("slot") as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshStandardMaterial
    >;
    const ownedDispose = vi.spyOn(clone.material, "dispose");
    model.dispose();
    model.dispose();
    expect(ownedDispose).toHaveBeenCalledTimes(1);
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(textureDispose).not.toHaveBeenCalled();
    expect(sourceDispose).not.toHaveBeenCalled();
  });

  test("rejects an empty or unseparated model", () => {
    expect(() => createEntrySlotModel(new THREE.Group())).toThrow(/reel/i);
  });
});
