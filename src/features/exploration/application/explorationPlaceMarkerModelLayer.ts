import maplibregl from "maplibre-gl";
import type { CustomLayerInterface, Map as MapLibreMap, MercatorCoordinate } from "maplibre-gl";
import * as THREE from "three";

import type { MapMarkerFeature } from "@shared/lib/maplibre/mapMarkerFeature";

import { EXPLORATION_MAP_CENTER } from "../config/explorationMapConfig";
import {
  EXPLORATION_PLACE_MARKER_MODEL_LAYER_ID,
  PLACE_MARKER_MODEL_DEFAULT_TINT,
  PLACE_MARKER_MODEL_REVEALED_TINT,
  PLACE_MARKER_MODEL_YAW_RADIANS,
} from "../config/explorationPlaceMarkerModelLayer";
import {
  calculatePlaceMarkerModelScale,
  type PlaceMarkerModel,
  type PlaceMarkerModelStates,
} from "./explorationPlaceMarkerModels";

type CreatePlaceMarkerModelLayerOptions = {
  onUnavailable: () => void;
};

type PlaceMarkerModelLayerMarkers = {
  features: readonly MapMarkerFeature[];
  states: PlaceMarkerModelStates;
  revealedPlaceIds: ReadonlySet<string>;
};

type ReadyModelFeatures = {
  model: PlaceMarkerModel;
  features: MapMarkerFeature[];
};

type WriteInstancesParams = {
  meshes: readonly THREE.InstancedMesh[];
  features: readonly MapMarkerFeature[];
  origin: MercatorCoordinate;
  scale: number;
  revealedPlaceIds: ReadonlySet<string>;
};

export type PlaceMarkerModelLayer = CustomLayerInterface & {
  setMarkers: (
    features: readonly MapMarkerFeature[],
    states: PlaceMarkerModelStates,
    revealedPlaceIds: ReadonlySet<string>
  ) => void;
};

const Y_UP_TO_Z_UP_RADIANS = Math.PI / 2;
const DEGREES_TO_RADIANS = Math.PI / 180;
const MODEL_UP_AXIS = new THREE.Vector3(0, 1, 0);
const REVEALED_TINT = new THREE.Color(PLACE_MARKER_MODEL_REVEALED_TINT);
const DEFAULT_TINT = new THREE.Color(PLACE_MARKER_MODEL_DEFAULT_TINT);

function createPlaceMarkerModelScene(): THREE.Scene {
  const scene = new THREE.Scene();
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);

  keyLight.position.set(2, 4, 3);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.2));
  scene.add(keyLight);

  return scene;
}

function createLocalToMercatorMatrix(origin: MercatorCoordinate): THREE.Matrix4 {
  const meterUnit = origin.meterInMercatorCoordinateUnits();

  return new THREE.Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new THREE.Vector3(meterUnit, -meterUnit, meterUnit))
    .multiply(new THREE.Matrix4().makeRotationX(Y_UP_TO_Z_UP_RADIANS));
}

function groupReadyModelFeatures({
  features,
  states,
}: PlaceMarkerModelLayerMarkers): Map<string, ReadyModelFeatures> {
  const groups = new Map<string, ReadyModelFeatures>();

  for (const feature of features) {
    const url = feature.properties.markerModelUrl;
    const state = url ? states.get(url) : undefined;
    if (!url || state?.status !== "ready") continue;

    const group = groups.get(url) ?? { model: state.model, features: [] };
    group.features.push(feature);
    groups.set(url, group);
  }

  return groups;
}

function createModelYaw(feature: MapMarkerFeature, target: THREE.Quaternion): THREE.Quaternion {
  const correctionRadians = (feature.properties.markerModelYawDegrees ?? 0) * DEGREES_TO_RADIANS;

  return target.setFromAxisAngle(MODEL_UP_AXIS, PLACE_MARKER_MODEL_YAW_RADIANS + correctionRadians);
}

function createInstancedMeshes(model: PlaceMarkerModel, capacity: number): THREE.InstancedMesh[] {
  return model.parts.map(({ geometry, material }) => {
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.frustumCulled = false;

    return mesh;
  });
}

function disposeInstancedMeshes(scene: THREE.Scene, meshes: readonly THREE.InstancedMesh[]): void {
  for (const mesh of meshes) {
    scene.remove(mesh);
    mesh.dispose();
  }
}

function writeInstances({
  meshes,
  features,
  origin,
  scale,
  revealedPlaceIds,
}: WriteInstancesParams): void {
  const meterUnit = origin.meterInMercatorCoordinateUnits();
  const position = new THREE.Vector3();
  const scaleVector = new THREE.Vector3().setScalar(scale);
  const matrix = new THREE.Matrix4();
  const yaw = new THREE.Quaternion();

  features.forEach((feature, index) => {
    const coordinate = maplibregl.MercatorCoordinate.fromLngLat(feature.geometry.coordinates);
    const tint = revealedPlaceIds.has(feature.properties.id) ? REVEALED_TINT : DEFAULT_TINT;

    position.set((coordinate.x - origin.x) / meterUnit, 0, (coordinate.y - origin.y) / meterUnit);
    matrix.compose(position, createModelYaw(feature, yaw), scaleVector);
    for (const mesh of meshes) {
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, tint);
    }
  });

  for (const mesh of meshes) {
    mesh.count = features.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}

export function createPlaceMarkerModelLayer({
  onUnavailable,
}: CreatePlaceMarkerModelLayerOptions): PlaceMarkerModelLayer {
  const scene = createPlaceMarkerModelScene();
  const camera = new THREE.Camera();
  const meshesByUrl = new Map<string, THREE.InstancedMesh[]>();
  let map: MapLibreMap | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let origin: MercatorCoordinate | null = null;
  let localToMercatorMatrix: THREE.Matrix4 | null = null;
  let syncedZoom: number | null = null;
  let markers: PlaceMarkerModelLayerMarkers = {
    features: [],
    states: new Map(),
    revealedPlaceIds: new Set(),
  };

  function ensureInstancedMeshes(url: string, model: PlaceMarkerModel, count: number) {
    const current = meshesByUrl.get(url);
    const capacity = current?.[0]?.instanceMatrix.count ?? 0;

    if (current && capacity >= count) return current;
    if (current) disposeInstancedMeshes(scene, current);

    const meshes = createInstancedMeshes(model, count);
    for (const mesh of meshes) scene.add(mesh);
    meshesByUrl.set(url, meshes);

    return meshes;
  }

  function syncInstances() {
    if (!map || !origin) return;

    const zoom = map.getZoom();
    const groups = groupReadyModelFeatures(markers);
    syncedZoom = zoom;

    for (const [url, meshes] of meshesByUrl) {
      if (groups.has(url)) continue;
      disposeInstancedMeshes(scene, meshes);
      meshesByUrl.delete(url);
    }

    for (const [url, { model, features }] of groups) {
      writeInstances({
        meshes: ensureInstancedMeshes(url, model, features.length),
        features,
        origin,
        scale: calculatePlaceMarkerModelScale(zoom),
        revealedPlaceIds: markers.revealedPlaceIds,
      });
    }
  }

  return {
    id: EXPLORATION_PLACE_MARKER_MODEL_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(nextMap, gl) {
      try {
        renderer = new THREE.WebGLRenderer({ canvas: nextMap.getCanvas(), context: gl });
      } catch {
        onUnavailable();
        return;
      }

      renderer.autoClear = false;
      map = nextMap;
      origin = maplibregl.MercatorCoordinate.fromLngLat(EXPLORATION_MAP_CENTER);
      localToMercatorMatrix = createLocalToMercatorMatrix(origin);
      syncInstances();
    },
    render(_gl, { defaultProjectionData }) {
      if (!renderer || !map || !localToMercatorMatrix) return;
      if (map.getZoom() !== syncedZoom) syncInstances();

      camera.projectionMatrix
        .fromArray(defaultProjectionData.mainMatrix)
        .multiply(localToMercatorMatrix);
      renderer.resetState();
      renderer.render(scene, camera);
    },
    onRemove() {
      for (const meshes of meshesByUrl.values()) disposeInstancedMeshes(scene, meshes);
      meshesByUrl.clear();
      renderer?.dispose();
      renderer = null;
      map = null;
    },
    setMarkers(features, states, revealedPlaceIds) {
      markers = { features, states, revealedPlaceIds };
      syncInstances();
      map?.triggerRepaint();
    },
  };
}
