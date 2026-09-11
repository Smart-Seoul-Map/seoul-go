import { cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import type { AtlasSceneryOptions } from "./atlasScenery";
import { useAtlasScenery } from "./useAtlasScenery";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("attaches when a scene is ready, survives rerenders, and cleans up on replacement and unmount", () => {
  const textures: THREE.Texture[] = [];
  const load = vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation(() => {
    const texture = new THREE.Texture<HTMLImageElement>();
    vi.spyOn(texture, "dispose");
    textures.push(texture);
    return texture;
  });
  const options: AtlasSceneryOptions<"house"> = {
    atlasUrl: "/test-atlas.png",
    manifest: {
      size: { width: 10, height: 10 },
      frames: { house: { x: 0, y: 0, width: 10, height: 10 } },
    },
    placements: [{ key: "house", name: "house", width: 2, position: { x: 0, y: 0, z: 0 } }],
    facing: new THREE.Quaternion(),
  };
  const { rerender, unmount } = renderHook(
    ({ parent }: { parent: THREE.Object3D | null }) => useAtlasScenery(parent, options),
    { initialProps: { parent: null as THREE.Object3D | null }, wrapper: StrictMode }
  );
  expect(load).not.toHaveBeenCalled();
  const first = new THREE.Scene();
  rerender({ parent: first });
  expect(first.children).toHaveLength(1);
  rerender({ parent: first });
  expect(load).toHaveBeenCalledTimes(1);
  const second = new THREE.Scene();
  rerender({ parent: second });
  expect(first.children).toHaveLength(0);
  expect(second.children).toHaveLength(1);
  expect(textures[0].dispose).toHaveBeenCalledTimes(1);
  unmount();
  expect(second.children).toHaveLength(0);
  expect(textures[1].dispose).toHaveBeenCalledTimes(1);
});
