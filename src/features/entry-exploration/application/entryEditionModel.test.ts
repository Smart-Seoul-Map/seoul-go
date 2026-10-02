import * as THREE from "three";
import { expect, test, vi } from "vitest";

import { createEntryEditionModel } from "./entryEditionModel";

test("fits an offset model to the entry scene without mutating or disposing cached assets", () => {
  const geometry = new THREE.BoxGeometry(2, 8, 4);
  const material = new THREE.MeshStandardMaterial();
  const source = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(10, 12, -4);
  source.add(mesh);
  const original = new THREE.Box3().setFromObject(source).clone();
  const disposeGeometry = vi.spyOn(geometry, "dispose");
  const disposeMaterial = vi.spyOn(material, "dispose");
  const instance = createEntryEditionModel(source, {
    url: "/model.glb",
    size: 4,
    rotationY: Math.PI / 4,
  });
  const bounds = new THREE.Box3().setFromObject(instance.object);
  expect(bounds.min.y).toBeCloseTo(0);
  expect(bounds.getCenter(new THREE.Vector3()).x).toBeCloseTo(0);
  expect(bounds.getCenter(new THREE.Vector3()).z).toBeCloseTo(0);
  expect(Math.max(...bounds.getSize(new THREE.Vector3()).toArray())).toBeCloseTo(4);
  expect(new THREE.Box3().setFromObject(source).equals(original)).toBe(true);
  instance.dispose();
  expect(disposeGeometry).not.toHaveBeenCalled();
  expect(disposeMaterial).not.toHaveBeenCalled();
  geometry.dispose();
  material.dispose();
});
