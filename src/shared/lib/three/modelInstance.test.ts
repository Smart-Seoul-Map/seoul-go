import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import { createModelInstance } from "./modelInstance";

function createSource() {
  const texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), material);
  mesh.position.set(5, 8, -3);
  const source = new THREE.Group();
  source.add(mesh);

  return { source, mesh, texture, material };
}

describe("createModelInstance", () => {
  test("grounds and centers a rotated model at the requested size without changing its source", () => {
    const { source, mesh } = createSource();
    const instance = createModelInstance(source, {
      size: 12,
      rotation: { x: 0, y: Math.PI / 2, z: 0 },
    });
    const bounds = new THREE.Box3().setFromObject(instance.object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    expect(size.x).toBeCloseTo(12);
    expect(size.y).toBeCloseTo(8);
    expect(size.z).toBeCloseTo(4);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(center.x).toBeCloseTo(0);
    expect(center.z).toBeCloseTo(0);
    expect(mesh.position.toArray()).toEqual([5, 8, -3]);
    expect(mesh.parent).toBe(source);
    instance.dispose();
  });

  test("isolates transforms and materials while retaining shared geometry and textures on disposal", () => {
    const { source, mesh, texture, material } = createSource();
    const first = createModelInstance(source, { size: 6 });
    const second = createModelInstance(source, { size: 6 });
    const firstMesh = first.object.getObjectByProperty("type", "Mesh") as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshStandardMaterial
    >;
    const secondMesh = second.object.getObjectByProperty("type", "Mesh") as typeof firstMesh;
    const disposeMaterial = vi.spyOn(firstMesh.material, "dispose");
    const disposeGeometry = vi.spyOn(mesh.geometry, "dispose");
    const disposeTexture = vi.spyOn(texture, "dispose");
    const disposeSourceMaterial = vi.spyOn(material, "dispose");
    const parent = new THREE.Group();
    parent.add(first.object, second.object);
    first.object.position.x = 42;
    firstMesh.material.color.set("red");

    expect(second.object.position.x).toBe(0);
    expect(secondMesh.material.color.getHex()).toBe(0xffffff);
    expect(material.color.getHex()).toBe(0xffffff);
    expect(firstMesh.geometry).toBe(mesh.geometry);
    expect(firstMesh.material.map).toBe(texture);
    first.dispose();
    first.dispose();
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeTexture).not.toHaveBeenCalled();
    expect(disposeSourceMaterial).not.toHaveBeenCalled();
    expect(parent.children).toEqual([second.object]);
    second.dispose();
  });

  test("clones skeletons so bone movement and cleanup cannot change the cached model", () => {
    const source = new THREE.Group();
    const bone = new THREE.Bone();
    const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    mesh.geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(new Uint16Array(96), 4)
    );
    const weights = new Float32Array(96);
    for (let index = 0; index < weights.length; index += 4) weights[index] = 1;
    mesh.geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
    mesh.add(bone);
    mesh.bind(new THREE.Skeleton([bone]));
    source.add(mesh);
    const instance = createModelInstance(source, { size: 1 });
    const cloned = instance.object.getObjectByProperty("type", "SkinnedMesh") as THREE.SkinnedMesh;
    const disposeOriginal = vi.spyOn(mesh.skeleton, "dispose");
    const disposeClone = vi.spyOn(cloned.skeleton, "dispose");
    cloned.skeleton.bones[0].position.x = 5;

    expect(bone.position.x).toBe(0);
    instance.dispose();
    expect(disposeClone).toHaveBeenCalledTimes(1);
    expect(disposeOriginal).not.toHaveBeenCalled();
  });

  test.each([0, -1, NaN, Infinity])("rejects invalid size %s", (size) => {
    expect(() => createModelInstance(createSource().source, { size })).toThrow();
  });

  test("rejects models without measurable geometry", () => {
    expect(() => createModelInstance(new THREE.Group(), { size: 1 })).toThrow();
  });
});
