import * as THREE from "three";

import { loadCharacterGltf } from "@shared/lib/character/gltfLoader";
import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import { EXPLORATION_MAP_MAX_ZOOM } from "../config/explorationMapConfig";
import { PLACE_MARKER_MODEL_HEIGHT_METERS } from "../config/explorationPlaceMarkerModelLayer";
import { calculateZoomScaleRatio } from "../domain/explorationZoomScale";

export type PlaceMarkerModelPart = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
};

export type PlaceMarkerModel = {
  parts: readonly PlaceMarkerModelPart[];
};

export type PlaceMarkerModelState =
  { status: "pending" } | { status: "ready"; model: PlaceMarkerModel } | { status: "unavailable" };

export type PlaceMarkerModelStates = ReadonlyMap<string, PlaceMarkerModelState>;

export type PlaceMarkerModelPartition = {
  modelFeatures: MapMarkerFeature[];
  symbolMarkers: MapMarkerFeatureCollection;
};

type PlaceMarkerPlacement = "model" | "symbol" | "hidden";

const placeMarkerModelCache = new Map<string, Promise<PlaceMarkerModel | null>>();

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as Partial<THREE.Mesh>).isMesh === true;
}

function collectBakedModelParts(scene: THREE.Object3D): PlaceMarkerModelPart[] {
  const parts: PlaceMarkerModelPart[] = [];

  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!isMesh(object)) return;
    parts.push({
      geometry: object.geometry.clone().applyMatrix4(object.matrixWorld),
      material: object.material,
    });
  });

  return parts;
}

function calculateModelBounds(parts: readonly PlaceMarkerModelPart[]): THREE.Box3 {
  const bounds = new THREE.Box3();

  for (const { geometry } of parts) {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) bounds.union(geometry.boundingBox);
  }

  return bounds;
}

export function createPlaceMarkerModel(scene: THREE.Object3D): PlaceMarkerModel | null {
  const parts = collectBakedModelParts(scene);
  const bounds = calculateModelBounds(parts);
  const size = bounds.getSize(new THREE.Vector3());
  const largestSide = Math.max(size.x, size.y, size.z);

  if (parts.length === 0 || !(size.y > 0)) return null;

  const center = bounds.getCenter(new THREE.Vector3());
  const normalizeMatrix = new THREE.Matrix4()
    .makeScale(1 / largestSide, 1 / largestSide, 1 / largestSide)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));

  for (const { geometry } of parts) geometry.applyMatrix4(normalizeMatrix);

  return { parts };
}

export function loadPlaceMarkerModel(url: string): Promise<PlaceMarkerModel | null> {
  const cachedModel = placeMarkerModelCache.get(url);

  if (cachedModel) return cachedModel;

  const model = loadCharacterGltf(url).then(
    (gltf) => createPlaceMarkerModel(gltf.scene),
    () => null
  );
  placeMarkerModelCache.set(url, model);

  return model;
}

export function collectPlaceMarkerModelUrls(collection: MapMarkerFeatureCollection): string[] {
  const urls = new Set<string>();

  for (const feature of collection.features) {
    const url = feature.properties.markerModelUrl;
    if (url) urls.add(url);
  }

  return [...urls];
}

function resolvePlaceMarkerPlacement(
  feature: MapMarkerFeature,
  states: PlaceMarkerModelStates,
  isModelLayerAvailable: boolean
): PlaceMarkerPlacement {
  const url = feature.properties.markerModelUrl;

  if (!url) return "symbol";
  if (isModelLayerAvailable && states.get(url)?.status === "ready") return "model";

  return "hidden";
}

export function partitionPlaceMarkersByModel(
  collection: MapMarkerFeatureCollection,
  states: PlaceMarkerModelStates,
  isModelLayerAvailable: boolean
): PlaceMarkerModelPartition {
  const modelFeatures: MapMarkerFeature[] = [];
  const symbolFeatures: MapMarkerFeature[] = [];

  for (const feature of collection.features) {
    const placement = resolvePlaceMarkerPlacement(feature, states, isModelLayerAvailable);
    if (placement === "model") modelFeatures.push(feature);
    if (placement === "symbol") symbolFeatures.push(feature);
  }

  const symbolMarkers =
    symbolFeatures.length === collection.features.length
      ? collection
      : { ...collection, features: symbolFeatures };

  return { modelFeatures, symbolMarkers };
}

export function calculatePlaceMarkerModelScale(zoomLevel: number): number {
  return (
    PLACE_MARKER_MODEL_HEIGHT_METERS *
    calculateZoomScaleRatio(zoomLevel, EXPLORATION_MAP_MAX_ZOOM) *
    2 ** (EXPLORATION_MAP_MAX_ZOOM - zoomLevel)
  );
}
