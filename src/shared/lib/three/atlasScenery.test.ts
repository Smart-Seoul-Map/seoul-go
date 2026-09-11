import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import { createAtlasScenery, type AtlasSceneryOptions } from "./atlasScenery";

const atlasOptions: AtlasSceneryOptions<"house"> = {
  atlasUrl: "/test-atlas.png",
  manifest: {
    size: { width: 100, height: 100 },
    frames: { house: { x: 0, y: 0, width: 20, height: 40 } },
  },
  placements: [
    { key: "house", name: "first-house", width: 2, position: { x: 1, y: 0, z: 3 } },
    { key: "house", name: "second-house", width: 4, position: { x: 5, y: 0, z: 6 } },
  ],
  facing: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5),
};

afterEach(() => vi.restoreAllMocks());

test("places repeated atlas frames with independent sizes and a shared texture", () => {
  const texture = new THREE.Texture<HTMLImageElement>();
  const load = vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(texture);
  const scenery = createAtlasScenery(atlasOptions);
  const [first, second] = scenery.object.children as THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  >[];
  expect(first.name).toBe("first-house");
  expect(first.position.toArray()).toEqual([1, 0, 3]);
  expect(first.quaternion.equals(atlasOptions.facing)).toBe(true);
  expect(first.geometry.parameters.height).toBe(4);
  expect(second.geometry.parameters.height).toBe(8);
  expect(first.material).toBe(second.material);
  expect(first.material.map).toBe(texture);
  expect(load).toHaveBeenCalledTimes(1);

  const parent = new THREE.Scene();
  parent.add(scenery.object);
  const disposeGeometry = vi.spyOn(first.geometry, "dispose");
  const disposeMaterial = vi.spyOn(first.material, "dispose");
  const disposeTexture = vi.spyOn(texture, "dispose");
  scenery.dispose();
  scenery.dispose();
  expect(parent.children).toHaveLength(0);
  expect(disposeGeometry).toHaveBeenCalledTimes(1);
  expect(disposeMaterial).toHaveBeenCalledTimes(1);
  expect(disposeTexture).toHaveBeenCalledTimes(1);
});

test("hides the group and reports a failed texture request", () => {
  let fail: ((error: unknown) => void) | undefined;
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation(
    (_url, _onLoad, _onProgress, onError) => {
      fail = onError;
      return new THREE.Texture<HTMLImageElement>();
    }
  );
  const onLoadError = vi.fn();
  const scenery = createAtlasScenery({ ...atlasOptions, onLoadError });
  const error = new Error("missing atlas");
  fail?.(error);
  expect(scenery.object.visible).toBe(false);
  expect(onLoadError).toHaveBeenCalledWith(error);
  scenery.dispose();
  fail?.(error);
  expect(onLoadError).toHaveBeenCalledTimes(1);
});

test("releases already created geometries when a later placement is invalid", () => {
  const disposeGeometry = vi.spyOn(THREE.PlaneGeometry.prototype, "dispose");
  const disposeMaterial = vi.spyOn(THREE.MeshBasicMaterial.prototype, "dispose");
  expect(() =>
    createAtlasScenery({
      ...atlasOptions,
      placements: [atlasOptions.placements[0], { ...atlasOptions.placements[1], width: -1 }],
    })
  ).toThrow("Invalid texture atlas frame");
  expect(disposeGeometry).toHaveBeenCalledTimes(1);
  expect(disposeMaterial).toHaveBeenCalledTimes(1);
});
