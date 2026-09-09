import * as THREE from "three";
import { afterEach, beforeEach, expect, onTestFinished, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { createEntryExplorationAtlasScenery } from "./entryExplorationAtlasScenery";
import {
  createEntryExplorationCamera,
  updateEntryExplorationCameraFocus,
} from "./entryExplorationThreeScene";

beforeEach(() => {
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(new THREE.Texture());
});

afterEach(() => {
  vi.restoreAllMocks();
});

test.each([
  [1440, 900],
  [1920, 1080],
  [375, 812],
  [390, 844],
])("reveals the tower tip at entry and the whole tower on approach at %ix%i", (width, height) => {
  const scenery = createEntryExplorationAtlasScenery();
  onTestFinished(() => scenery.dispose());
  scenery.positionTowerAtEntry(width / height);
  const tower = scenery.object.getObjectByName("entry-atlas-tower");
  expect(tower).toBeInstanceOf(THREE.Mesh);
  if (!(tower instanceof THREE.Mesh)) {
    throw new Error("The entry tower is missing.");
  }

  const camera = createEntryExplorationCamera(width, height);
  const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
  updateEntryExplorationCameraFocus(camera, arrival);
  const initialBounds = projectMeshBounds(tower, camera);

  // NDC ranges from -1 to 1: only the upper part should peek above the bottom edge.
  expect(initialBounds.max.y).toBeGreaterThan(-0.95);
  expect(initialBounds.max.y).toBeLessThan(-0.7);
  expect(initialBounds.min.y).toBeLessThan(-1);
  const tipX = initialBounds.getCenter(new THREE.Vector3()).x;
  expect(tipX).toBeGreaterThan(0.88);
  expect(tipX).toBeLessThan(0.92);

  updateEntryExplorationCameraFocus(camera, {
    x: arrival.x + (tower.position.x - arrival.x) * 0.8,
    z: arrival.z + (tower.position.z - arrival.z) * 0.8,
  });
  const approachedBounds = projectMeshBounds(tower, camera);
  expect(approachedBounds.min.x).toBeGreaterThan(-1);
  expect(approachedBounds.max.x).toBeLessThan(1);
  expect(approachedBounds.min.y).toBeGreaterThan(-1);
  expect(approachedBounds.max.y).toBeLessThan(1);
});

function projectMeshBounds(mesh: THREE.Mesh, camera: THREE.Camera): THREE.Box3 {
  mesh.updateWorldMatrix(true, false);
  camera.updateMatrixWorld();
  const positions = mesh.geometry.getAttribute("position");
  const bounds = new THREE.Box3();
  for (let index = 0; index < positions.count; index += 1) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, index);
    bounds.expandByPoint(mesh.localToWorld(point).project(camera));
  }

  return bounds;
}
