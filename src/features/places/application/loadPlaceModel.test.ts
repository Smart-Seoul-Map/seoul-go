import * as THREE from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";

const loader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load = loader.load;
  },
}));

import { clearGltfCache } from "@shared/lib/three/gltfLoader";
import { loadPlaceModel } from "../models";

const place = { id: "theme:place-1", imageUrl: "/place.png" };
const assets = { [place.id]: { url: "/models/place.glb", size: 2 } };

describe("loadPlaceModel", () => {
  beforeEach(() => {
    clearGltfCache();
    loader.load.mockReset();
    loader.load.mockImplementation((_path, onLoad) => {
      const scene = new THREE.Group();
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
      onLoad({ scene, animations: [] });
    });
  });

  test("returns the place image without requesting a GLB when its ID is unmapped", async () => {
    expect(await loadPlaceModel(place)).toEqual({
      type: "image",
      placeId: place.id,
      imageUrl: "/place.png",
      reason: "unmapped",
    });
    expect(loader.load).not.toHaveBeenCalled();
    expect((await loadPlaceModel({ ...place, id: "other-theme:place-1" }, { assets })).type).toBe(
      "image"
    );
  });

  test("loads one source and creates independent placements for entry and map", async () => {
    const first = await loadPlaceModel(place, { assets });
    const second = await loadPlaceModel(place, { assets });
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(loader.load.mock.calls[0][0]).toBe("/models/place.glb");
    expect(first.type).toBe("model");
    expect(second.type).toBe("model");
    if (first.type !== "model" || second.type !== "model") throw new Error("Missing model");
    expect(first.placeId).toBe(place.id);
    expect(first.instance.object).not.toBe(second.instance.object);
    first.instance.dispose();
    expect(new THREE.Box3().setFromObject(second.instance.object).isEmpty()).toBe(false);
    second.instance.dispose();
  });

  test("returns an image on failure and allows the next call to retry", async () => {
    loader.load.mockImplementationOnce((_path, _onLoad, _progress, onError) =>
      onError(new Error("offline"))
    );
    const failed = await loadPlaceModel(place, { assets });
    expect(failed).toMatchObject({
      type: "image",
      placeId: place.id,
      reason: "load-failed",
      imageUrl: "/place.png",
    });
    const retried = await loadPlaceModel(place, { assets });
    expect(retried.type).toBe("model");
    if (retried.type === "model") retried.instance.dispose();
  });

  test("cancels an abandoned consumer without cancelling another consumer's shared request", async () => {
    loader.load.mockImplementation(() => {});
    const controller = new AbortController();
    const abandoned = loadPlaceModel(place, { assets, signal: controller.signal });
    const active = loadPlaceModel(place, { assets });
    await vi.waitFor(() => expect(loader.load).toHaveBeenCalledTimes(1));
    controller.abort();
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
    loader.load.mock.calls[0][1]({ scene, animations: [] });

    expect(await abandoned).toEqual({ type: "cancelled", placeId: place.id });
    const result = await active;
    expect(result.type).toBe("model");
    expect(loader.load).toHaveBeenCalledTimes(1);
    if (result.type === "model") result.instance.dispose();
  });
});
