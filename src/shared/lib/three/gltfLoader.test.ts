import { beforeEach, describe, expect, test, vi } from "vitest";

const loader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load = loader.load;
  },
}));

import { loadCharacterGltf } from "../character/gltfLoader";
import { clearGltfCache, loadGltf } from "./gltfLoader";

describe("shared GLB cache", () => {
  beforeEach(() => {
    clearGltfCache();
    loader.load.mockReset();
  });

  test("shares an in-flight request across generic and character consumers", async () => {
    const first = loadGltf("/models/shared.glb");
    const character = loadCharacterGltf("/models/shared.glb");

    expect(character).toBe(first);
    expect(loader.load).toHaveBeenCalledTimes(1);
    const result = { scene: {}, animations: [] };
    loader.load.mock.calls[0][1](result);
    expect(await first).toBe(result);
  });

  test("an older failed request cannot evict a replacement after cache reset", async () => {
    const oldRequest = loadGltf("/models/shared.glb");
    const rejected = expect(oldRequest).rejects.toThrow("offline");
    clearGltfCache();
    const replacement = loadGltf("/models/shared.glb");
    loader.load.mock.calls[0][3](new Error("offline"));
    await rejected;
    expect(loadGltf("/models/shared.glb")).toBe(replacement);
    loader.load.mock.calls[1][1]({ scene: {}, animations: [] });
    await replacement;
  });
});
