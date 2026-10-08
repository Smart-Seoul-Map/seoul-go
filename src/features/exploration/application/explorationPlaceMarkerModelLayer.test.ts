import maplibregl from "maplibre-gl";
import type { CustomRenderMethodInput, Map as MapLibreMap } from "maplibre-gl";
import * as THREE from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { MapMarkerFeature } from "@shared/lib/maplibre/mapMarkerFeature";

import { EXPLORATION_MAP_CENTER } from "../config/explorationMapConfig";
import {
  EXPLORATION_PLACE_MARKER_MODEL_LAYER_ID,
  PLACE_MARKER_MODEL_DEFAULT_TINT,
  PLACE_MARKER_MODEL_REVEALED_TINT,
} from "../config/explorationPlaceMarkerModelLayer";
import { createPlaceMarkerModelLayer } from "./explorationPlaceMarkerModelLayer";
import {
  calculatePlaceMarkerModelScale,
  type PlaceMarkerModel,
  type PlaceMarkerModelState,
} from "./explorationPlaceMarkerModels";

const rendererMock = vi.hoisted(() => ({
  shouldThrow: false,
  instances: [] as Array<{
    options: unknown;
    autoClear: boolean;
    render: ReturnType<typeof vi.fn>;
    resetState: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    forceContextLoss: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();

  class WebGLRenderer {
    autoClear = true;
    render = vi.fn();
    resetState = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();

    constructor(public options: unknown) {
      if (rendererMock.shouldThrow) throw new Error("WebGL2 is not available");
      rendererMock.instances.push(this);
    }
  }

  return { ...actual, WebGLRenderer };
});

const MODEL_A = "/models/markers/a.glb";
const MODEL_B = "/models/markers/b.glb";
const MODEL_PENDING = "/models/markers/pending.glb";
const IDENTITY = new THREE.Matrix4().toArray();

function createModel(partCount = 1): PlaceMarkerModel {
  return {
    parts: Array.from({ length: partCount }, () => ({
      geometry: new THREE.BoxGeometry(1, 1, 1),
      material: new THREE.MeshBasicMaterial(),
    })),
  };
}

function createFeature(
  id: string,
  markerModelUrl: string | undefined,
  coordinates: [number, number] = EXPLORATION_MAP_CENTER
): MapMarkerFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates },
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

function createMap(zoom = 17) {
  const map = {
    zoom,
    canvas: document.createElement("canvas"),
    getCanvas: vi.fn(() => map.canvas),
    getZoom: vi.fn(() => map.zoom),
    triggerRepaint: vi.fn(),
  };

  return map;
}

const gl = {} as WebGLRenderingContext;
const renderInput = {
  defaultProjectionData: { mainMatrix: IDENTITY },
} as unknown as CustomRenderMethodInput;

function setup({ zoom = 17 } = {}) {
  const onUnavailable = vi.fn();
  const layer = createPlaceMarkerModelLayer({ onUnavailable });
  const map = createMap(zoom);

  layer.onAdd?.(map as unknown as MapLibreMap, gl);

  return { layer, map, onUnavailable };
}

function renderAndGetScene(layer: ReturnType<typeof setup>["layer"]): THREE.Scene {
  layer.render(gl, renderInput);
  const renderer = rendererMock.instances.at(-1);
  const scene = renderer?.render.mock.calls.at(-1)?.[0] as THREE.Scene | undefined;
  if (!scene) throw new Error("the layer did not render a scene");

  return scene;
}

function getInstancedMeshes(scene: THREE.Scene): THREE.InstancedMesh[] {
  return scene.children.filter(
    (child): child is THREE.InstancedMesh => (child as THREE.InstancedMesh).isInstancedMesh
  );
}

function decomposeInstance(mesh: THREE.InstancedMesh, index: number) {
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  mesh.getMatrixAt(index, matrix);
  matrix.decompose(position, quaternion, scale);

  return { position, scale };
}

beforeEach(() => {
  rendererMock.shouldThrow = false;
  rendererMock.instances.length = 0;
});

describe("createPlaceMarkerModelLayer", () => {
  test("is a 3D custom layer with a fixed id", () => {
    const layer = createPlaceMarkerModelLayer({ onUnavailable: vi.fn() });

    expect(layer).toMatchObject({
      id: EXPLORATION_PLACE_MARKER_MODEL_LAYER_ID,
      type: "custom",
      renderingMode: "3d",
    });
  });

  test("shares the map canvas and GL context without clearing the map", () => {
    const { map } = setup();
    const renderer = rendererMock.instances[0];

    expect(renderer?.options).toEqual({ canvas: map.canvas, context: gl });
    expect(renderer?.autoClear).toBe(false);
  });

  test("creates one instanced mesh per model part with an instance per ready marker", () => {
    const { layer, map } = setup();
    const modelA = createModel(2);
    const modelB = createModel(1);
    const states = new Map<string, PlaceMarkerModelState>([
      [MODEL_A, { status: "ready", model: modelA }],
      [MODEL_B, { status: "ready", model: modelB }],
      [MODEL_PENDING, { status: "pending" }],
    ]);

    layer.setMarkers(
      [
        createFeature("a-1", MODEL_A),
        createFeature("a-2", MODEL_A),
        createFeature("a-3", MODEL_A),
        createFeature("b-1", MODEL_B),
        createFeature("pending", MODEL_PENDING),
        createFeature("symbol", undefined),
      ],
      states,
      new Set()
    );
    const meshes = getInstancedMeshes(renderAndGetScene(layer));

    expect(map.triggerRepaint).toHaveBeenCalledOnce();
    expect(meshes).toHaveLength(3);
    const meshesA = meshes.filter(
      (mesh) =>
        mesh.material === modelA.parts[0]?.material || mesh.material === modelA.parts[1]?.material
    );
    const meshesB = meshes.filter((mesh) => mesh.material === modelB.parts[0]?.material);
    expect(meshesA.map((mesh) => mesh.count)).toEqual([3, 3]);
    expect(meshesB.map((mesh) => mesh.count)).toEqual([1]);
    expect(meshesB[0]?.geometry).toBe(modelB.parts[0]?.geometry);
    expect(meshes.every((mesh) => mesh.frustumCulled === false)).toBe(true);
  });

  test("reuses the instanced mesh within capacity and recreates it only when it grows", () => {
    const { layer } = setup();
    const states = new Map<string, PlaceMarkerModelState>([
      [MODEL_A, { status: "ready", model: createModel() }],
    ]);
    const features = ["1", "2", "3"].map((id) => createFeature(id, MODEL_A));

    layer.setMarkers(features.slice(0, 2), states, new Set());
    const [first] = getInstancedMeshes(renderAndGetScene(layer));
    const disposeFirst = vi.spyOn(first as THREE.InstancedMesh, "dispose");

    layer.setMarkers(features.slice(0, 1), states, new Set());
    const [shrunk] = getInstancedMeshes(renderAndGetScene(layer));
    expect(shrunk).toBe(first);
    expect(shrunk?.count).toBe(1);

    layer.setMarkers(features, states, new Set());
    const scene = renderAndGetScene(layer);
    const [grown] = getInstancedMeshes(scene);
    expect(grown).not.toBe(first);
    expect(grown?.count).toBe(3);
    expect(disposeFirst).toHaveBeenCalledOnce();
    expect(getInstancedMeshes(scene)).toHaveLength(1);

    layer.setMarkers([], states, new Set());
    expect(getInstancedMeshes(renderAndGetScene(layer))).toHaveLength(0);
  });

  test("tints revealed markers gray and keeps the others untinted", () => {
    const { layer } = setup();
    const states = new Map<string, PlaceMarkerModelState>([
      [MODEL_A, { status: "ready", model: createModel() }],
    ]);

    layer.setMarkers(
      [createFeature("closed", MODEL_A), createFeature("revealed", MODEL_A)],
      states,
      new Set(["revealed"])
    );
    const [mesh] = getInstancedMeshes(renderAndGetScene(layer));
    const color = new THREE.Color();

    mesh?.getColorAt(0, color);
    expect(color.getHex()).toBe(PLACE_MARKER_MODEL_DEFAULT_TINT);
    mesh?.getColorAt(1, color);
    expect(color.getHex()).toBe(PLACE_MARKER_MODEL_REVEALED_TINT);
  });

  test("places instances in local meters around the map center with the zoom scale", () => {
    const { layer, map } = setup({ zoom: 16 });
    const states = new Map<string, PlaceMarkerModelState>([
      [MODEL_A, { status: "ready", model: createModel() }],
    ]);
    const [lng, lat] = EXPLORATION_MAP_CENTER;
    const origin = maplibregl.MercatorCoordinate.fromLngLat(EXPLORATION_MAP_CENTER);
    const east = maplibregl.MercatorCoordinate.fromLngLat([lng + 0.001, lat]);
    const eastMeters = (east.x - origin.x) / origin.meterInMercatorCoordinateUnits();

    layer.setMarkers(
      [
        createFeature("center", MODEL_A, [lng, lat]),
        createFeature("east", MODEL_A, [lng + 0.001, lat]),
        createFeature("north", MODEL_A, [lng, lat + 0.001]),
      ],
      states,
      new Set()
    );
    const [mesh] = getInstancedMeshes(renderAndGetScene(layer)) as [THREE.InstancedMesh];
    const center = decomposeInstance(mesh, 0);
    const eastInstance = decomposeInstance(mesh, 1);
    const northInstance = decomposeInstance(mesh, 2);

    expect(center.position.length()).toBeCloseTo(0);
    expect(eastMeters).toBeGreaterThan(80);
    expect(eastInstance.position.x).toBeCloseTo(eastMeters, 3);
    expect(eastInstance.position.y).toBeCloseTo(0);
    expect(eastInstance.position.z).toBeCloseTo(0, 3);
    expect(northInstance.position.z).toBeLessThan(-100);
    expect(northInstance.position.x).toBeCloseTo(0, 3);
    expect(center.scale.x).toBeCloseTo(calculatePlaceMarkerModelScale(16), 3);
    expect(center.scale.y).toBeCloseTo(calculatePlaceMarkerModelScale(16), 3);

    map.zoom = 17;
    renderAndGetScene(layer);
    expect(decomposeInstance(mesh, 0).scale.x).toBeCloseTo(calculatePlaceMarkerModelScale(17), 3);
  });

  test("projects local meters into mercator units with y up as altitude", () => {
    const { layer } = setup();
    renderAndGetScene(layer);
    const camera = rendererMock.instances[0]?.render.mock.calls[0]?.[1] as THREE.Camera;
    const origin = maplibregl.MercatorCoordinate.fromLngLat(EXPLORATION_MAP_CENTER);
    const meterUnit = origin.meterInMercatorCoordinateUnits();

    const base = new THREE.Vector3(0, 0, 0).applyMatrix4(camera.projectionMatrix);
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(camera.projectionMatrix);
    const south = new THREE.Vector3(0, 0, 1).applyMatrix4(camera.projectionMatrix);

    expect(base.x).toBeCloseTo(origin.x, 9);
    expect(base.y).toBeCloseTo(origin.y, 9);
    expect(up.z - base.z).toBeCloseTo(meterUnit, 12);
    expect(south.y - base.y).toBeCloseTo(meterUnit, 12);
    expect(rendererMock.instances[0]?.resetState).toHaveBeenCalledBefore(
      rendererMock.instances[0]?.render as ReturnType<typeof vi.fn>
    );
  });

  test("syncs markers set before the layer is added", () => {
    const onUnavailable = vi.fn();
    const layer = createPlaceMarkerModelLayer({ onUnavailable });
    const states = new Map<string, PlaceMarkerModelState>([
      [MODEL_A, { status: "ready", model: createModel() }],
    ]);

    expect(() =>
      layer.setMarkers([createFeature("early", MODEL_A)], states, new Set())
    ).not.toThrow();
    layer.onAdd?.(createMap() as unknown as MapLibreMap, gl);

    expect(getInstancedMeshes(renderAndGetScene(layer)).map((mesh) => mesh.count)).toEqual([1]);
  });

  test("reports unavailable and stays idle when the WebGL renderer cannot be created", () => {
    rendererMock.shouldThrow = true;
    const { layer, map, onUnavailable } = setup();

    expect(onUnavailable).toHaveBeenCalledOnce();
    expect(() => layer.render(gl, renderInput)).not.toThrow();
    expect(() =>
      layer.setMarkers(
        [createFeature("a", MODEL_A)],
        new Map([[MODEL_A, { status: "ready", model: createModel() }]]),
        new Set()
      )
    ).not.toThrow();
    expect(map.triggerRepaint).not.toHaveBeenCalled();
    expect(() => layer.onRemove?.(map as unknown as MapLibreMap, gl)).not.toThrow();
  });

  test("disposes instance buffers and the renderer without losing the map context", () => {
    const { layer, map } = setup();
    const model = createModel();
    const geometryDispose = vi.spyOn(model.parts[0]?.geometry as THREE.BufferGeometry, "dispose");
    layer.setMarkers(
      [createFeature("a", MODEL_A)],
      new Map([[MODEL_A, { status: "ready", model }]]),
      new Set()
    );
    const scene = renderAndGetScene(layer);
    const renderer = rendererMock.instances[0];

    layer.onRemove?.(map as unknown as MapLibreMap, gl);

    expect(getInstancedMeshes(scene)).toHaveLength(0);
    expect(renderer?.dispose).toHaveBeenCalledOnce();
    expect(renderer?.forceContextLoss).not.toHaveBeenCalled();
    expect(geometryDispose).not.toHaveBeenCalled();
    renderer?.render.mockClear();
    layer.render(gl, renderInput);
    expect(renderer?.render).not.toHaveBeenCalled();
  });
});
