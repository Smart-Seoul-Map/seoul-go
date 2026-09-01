import { beforeEach, describe, expect, test, vi } from "vitest";

const gltfLoaderMock = vi.hoisted(() => ({
  load: vi.fn(),
}));

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load = gltfLoaderMock.load;
  },
}));

import { clearCharacterGltfCache, loadCharacterGltf } from "./gltfLoader";

describe("loadCharacterGltf", () => {
  beforeEach(() => {
    clearCharacterGltfCache();
    gltfLoaderMock.load.mockReset();
    gltfLoaderMock.load.mockImplementation((path: string, onLoad: (value: unknown) => void) => {
      onLoad({ animations: [], scene: { path } });
    });
  });

  test("loads a GLB file through GLTFLoader", async () => {
    const gltf = await loadCharacterGltf("/models/haechi_v1.glb");

    expect(gltfLoaderMock.load).toHaveBeenCalledWith(
      "/models/haechi_v1.glb",
      expect.any(Function),
      undefined,
      expect.any(Function)
    );
    expect(gltf).toMatchObject({
      scene: { path: "/models/haechi_v1.glb" },
    });
  });

  test("reuses the cached GLB promise for the same path", async () => {
    const firstGltf = await loadCharacterGltf("/models/haechi_v1.glb");
    const secondGltf = await loadCharacterGltf("/models/haechi_v1.glb");

    expect(secondGltf).toBe(firstGltf);
    expect(gltfLoaderMock.load).toHaveBeenCalledTimes(1);
  });
});
