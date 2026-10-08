import * as THREE from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import { PLACE_MARKER_MODEL_HEIGHT_METERS } from "../config/explorationPlaceMarkerModelLayer";
import {
  calculatePlaceMarkerModelScale,
  collectPlaceMarkerModelUrls,
  createPlaceMarkerModel,
  loadPlaceMarkerModel,
  partitionPlaceMarkersByModel,
  type PlaceMarkerModel,
  type PlaceMarkerModelState,
} from "./explorationPlaceMarkerModels";

const gltfLoaderMock = vi.hoisted(() => ({
  loadCharacterGltf: vi.fn(),
}));

vi.mock("@shared/lib/character/gltfLoader", () => gltfLoaderMock);

let urlSequence = 0;
function uniqueModelUrl() {
  urlSequence += 1;
  return `/models/markers/test-${urlSequence}.glb`;
}

function createBoxScene(): THREE.Scene {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), new THREE.MeshBasicMaterial());

  group.position.set(10, 3, -5);
  group.scale.setScalar(2);
  group.add(mesh);
  scene.add(group);

  return scene;
}

function measure(model: PlaceMarkerModel): THREE.Box3 {
  const bounds = new THREE.Box3();

  for (const { geometry } of model.parts) {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) bounds.union(geometry.boundingBox);
  }

  return bounds;
}

function createFeature(id: string, markerModelUrl?: string): MapMarkerFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [126.97, 37.56] },
    properties: {
      id,
      imageUrl: "",
      name: id,
      themeId: "100032",
      themeName: "Theme",
      markerColor: "#c92a2a",
      closedMarkerImage: "red_closed_box",
      markerImage: "red_closed_box",
      openMarkerImage: "red_open_box",
      ...(markerModelUrl ? { markerModelUrl } : {}),
    },
  };
}

function createCollection(features: MapMarkerFeature[]): MapMarkerFeatureCollection {
  return { type: "FeatureCollection", features };
}

const readyModel: PlaceMarkerModel = { parts: [] };

beforeEach(() => {
  gltfLoaderMock.loadCharacterGltf.mockReset();
});

describe("createPlaceMarkerModel", () => {
  test("bakes transforms and fits the model in a 1-unit cube resting on y = 0", () => {
    const model = createPlaceMarkerModel(createBoxScene());

    expect(model?.parts).toHaveLength(1);
    const bounds = measure(model as PlaceMarkerModel);
    expect(bounds.min.y).toBeCloseTo(0);
    expect((bounds.min.x + bounds.max.x) / 2).toBeCloseTo(0);
    expect((bounds.min.z + bounds.max.z) / 2).toBeCloseTo(0);
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(2 / 6);
    expect(bounds.max.y - bounds.min.y).toBeCloseTo(4 / 6);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(1);
  });

  test("does not mutate the source scene geometry", () => {
    const scene = createBoxScene();
    const mesh = scene.children[0]?.children[0] as THREE.Mesh;
    const before = Array.from(mesh.geometry.getAttribute("position").array);

    createPlaceMarkerModel(scene);

    expect(Array.from(mesh.geometry.getAttribute("position").array)).toEqual(before);
  });

  test("returns null for an empty scene", () => {
    expect(createPlaceMarkerModel(new THREE.Scene())).toBeNull();
  });

  test("returns null for a flat model without height", () => {
    const scene = new THREE.Scene();
    const plane = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 0, 1], 3)
    );
    scene.add(new THREE.Mesh(plane, new THREE.MeshBasicMaterial()));

    expect(createPlaceMarkerModel(scene)).toBeNull();
  });
});

describe("loadPlaceMarkerModel", () => {
  test("loads each URL once and shares the normalized model", async () => {
    const url = uniqueModelUrl();
    gltfLoaderMock.loadCharacterGltf.mockResolvedValue({ scene: createBoxScene() });

    const [first, second] = await Promise.all([
      loadPlaceMarkerModel(url),
      loadPlaceMarkerModel(url),
    ]);
    const third = await loadPlaceMarkerModel(url);

    expect(gltfLoaderMock.loadCharacterGltf).toHaveBeenCalledTimes(1);
    expect(gltfLoaderMock.loadCharacterGltf).toHaveBeenCalledWith(url);
    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  test("resolves null when the GLB has no mesh", async () => {
    gltfLoaderMock.loadCharacterGltf.mockResolvedValue({ scene: new THREE.Scene() });

    await expect(loadPlaceMarkerModel(uniqueModelUrl())).resolves.toBeNull();
  });

  test("resolves null instead of rejecting when the loader fails", async () => {
    gltfLoaderMock.loadCharacterGltf.mockRejectedValue(new Error("404"));

    await expect(loadPlaceMarkerModel(uniqueModelUrl())).resolves.toBeNull();
  });

  test("loads different URLs separately", async () => {
    gltfLoaderMock.loadCharacterGltf.mockImplementation(async () => ({ scene: createBoxScene() }));

    const [first, second] = await Promise.all([
      loadPlaceMarkerModel(uniqueModelUrl()),
      loadPlaceMarkerModel(uniqueModelUrl()),
    ]);

    expect(gltfLoaderMock.loadCharacterGltf).toHaveBeenCalledTimes(2);
    expect(first).not.toBe(second);
  });
});

describe("collectPlaceMarkerModelUrls", () => {
  test("returns unique model URLs in feature order", () => {
    expect(
      collectPlaceMarkerModelUrls(
        createCollection([
          createFeature("a", "/a.glb"),
          createFeature("b"),
          createFeature("c", "/c.glb"),
          createFeature("d", "/a.glb"),
        ])
      )
    ).toEqual(["/a.glb", "/c.glb"]);
  });
});

describe("partitionPlaceMarkersByModel", () => {
  const states = new Map<string, PlaceMarkerModelState>([
    ["/ready.glb", { status: "ready", model: readyModel }],
    ["/unavailable.glb", { status: "unavailable" }],
    ["/pending.glb", { status: "pending" }],
  ]);

  test("routes ready models to the model layer, keeps model-less markers as symbols and hides the rest", () => {
    const collection = createCollection([
      createFeature("no-url"),
      createFeature("ready", "/ready.glb"),
      createFeature("unavailable", "/unavailable.glb"),
      createFeature("pending", "/pending.glb"),
      createFeature("unknown", "/unknown.glb"),
    ]);

    const { modelFeatures, symbolMarkers } = partitionPlaceMarkersByModel(collection, states, true);

    expect(modelFeatures.map((feature) => feature.id)).toEqual(["ready"]);
    expect(symbolMarkers.type).toBe("FeatureCollection");
    expect(symbolMarkers.features.map((feature) => feature.id)).toEqual(["no-url"]);
  });

  test("hides every model marker when the model layer is unavailable", () => {
    const collection = createCollection([
      createFeature("ready", "/ready.glb"),
      createFeature("pending", "/pending.glb"),
      createFeature("no-url"),
    ]);

    const { modelFeatures, symbolMarkers } = partitionPlaceMarkersByModel(
      collection,
      states,
      false
    );

    expect(modelFeatures).toEqual([]);
    expect(symbolMarkers.features.map((feature) => feature.id)).toEqual(["no-url"]);
  });

  test("keeps the same collection when no marker has a model", () => {
    const collection = createCollection([createFeature("a"), createFeature("b")]);

    expect(partitionPlaceMarkersByModel(collection, new Map(), true).symbolMarkers).toBe(
      collection
    );
  });
});

describe("calculatePlaceMarkerModelScale", () => {
  test("uses the configured height at the max zoom", () => {
    expect(calculatePlaceMarkerModelScale(17)).toBeCloseTo(PLACE_MARKER_MODEL_HEIGHT_METERS);
  });

  test("follows the symbol icon size curve when zooming out", () => {
    expect(calculatePlaceMarkerModelScale(16)).toBeCloseTo(
      PLACE_MARKER_MODEL_HEIGHT_METERS * 0.75 * 2
    );
    expect(calculatePlaceMarkerModelScale(15)).toBeCloseTo(
      PLACE_MARKER_MODEL_HEIGHT_METERS * 0.5 * 4
    );
  });
});
