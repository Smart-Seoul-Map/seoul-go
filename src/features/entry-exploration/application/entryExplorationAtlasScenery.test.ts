import * as THREE from "three";
import { afterEach, beforeEach, expect, onTestFinished, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { createEntryExplorationGuideRoute } from "../domain/entryExplorationGuideRoute";
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
])("keeps the tower to the right with a 2-3 second guide route at %ix%i", (width, height) => {
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

  expect(initialBounds.max.y).toBeGreaterThan(-1);
  expect(initialBounds.min.x).toBeLessThan(1);
  const tipX = initialBounds.getCenter(new THREE.Vector3()).x;
  expect(tipX).toBeGreaterThan(2 / 3);
  expect(tipX).toBeLessThan(0.92);

  const route = createEntryExplorationGuideRoute({
    origin: arrival,
    towerPosition: tower.position,
    cameraOffset: ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset,
  });
  const point = ({ x, z }: { x: number; z: number }) => new THREE.Vector3(x, 0, z);
  const length =
    point(arrival).distanceTo(point(route.bendStart)) +
    new THREE.QuadraticBezierCurve3(
      point(route.bendStart),
      point(route.bendControl),
      point(route.bendEnd)
    ).getLength() +
    point(route.bendEnd).distanceTo(point(route.destination));
  const seconds = length / ENTRY_EXPLORATION_SCENE_CONFIG.characterSpeedPerSecond;
  expect(seconds).toBeGreaterThanOrEqual(2);
  expect(seconds).toBeLessThanOrEqual(3);
  const firstPosition = tower.position.clone();
  scenery.positionTowerAtEntry(width / height);
  expect(tower.position.distanceTo(firstPosition)).toBeLessThan(0.0001);

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
