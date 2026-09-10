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
  [360, 844],
  [375, 812],
  [390, 844],
])(
  "guides to the hanok in 2-3 seconds and reveals the tower while approaching at %ix%i",
  (width, height) => {
    const scenery = createEntryExplorationAtlasScenery();
    onTestFinished(() => scenery.dispose());
    const destination = scenery.positionLandmarksAtEntry(width / height);
    const hanok = scenery.object.getObjectByName("entry-atlas-hanok");
    const tower = scenery.object.getObjectByName("entry-atlas-tower");
    if (!(hanok instanceof THREE.Mesh) || !(tower instanceof THREE.Mesh)) {
      throw new Error("The entry landmarks are missing.");
    }
    expect(destination).toEqual({ x: hanok.position.x, z: hanok.position.z });

    const camera = createEntryExplorationCamera(width, height);
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    updateEntryExplorationCameraFocus(camera, arrival);
    const initialBounds = projectMeshBounds(hanok, camera);

    expect(initialBounds.max.y).toBeGreaterThan(-1);
    expect(initialBounds.min.x).toBeLessThan(1);
    const tipX = initialBounds.getCenter(new THREE.Vector3()).x;
    expect(tipX).toBeGreaterThan(2 / 3);
    expect(tipX).toBeLessThan(0.92);
    expect(projectMeshBounds(tower, camera).min.x).toBeGreaterThan(1);

    const route = createEntryExplorationGuideRoute({
      origin: arrival,
      destination: hanok.position,
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
    const firstHanokPosition = hanok.position.clone();
    const firstTowerPosition = tower.position.clone();
    scenery.positionLandmarksAtEntry(width / height);
    expect(hanok.position.distanceTo(firstHanokPosition)).toBeLessThan(0.0001);
    expect(tower.position.distanceTo(firstTowerPosition)).toBeLessThan(0.0001);

    updateEntryExplorationCameraFocus(camera, {
      x: arrival.x + (hanok.position.x - arrival.x) * 0.8,
      z: arrival.z + (hanok.position.z - arrival.z) * 0.8,
    });
    const approachedBounds = projectMeshBounds(tower, camera);
    expect(approachedBounds.min.x).toBeLessThan(1);
    expect(approachedBounds.max.y).toBeGreaterThan(-1);
    expect(approachedBounds.min.z).toBeGreaterThan(-1);
    expect(approachedBounds.max.z).toBeLessThan(1);

    updateEntryExplorationCameraFocus(camera, hanok.position);
    const hanokBounds = projectMeshBounds(hanok, camera);
    expect(hanokBounds.min.x).toBeGreaterThan(-1);
    expect(hanokBounds.max.x).toBeLessThan(1);
    expect(hanokBounds.max.y).toBeLessThan(1);
    expect(projectMeshBounds(tower, camera).max.y).toBeLessThan(hanokBounds.min.y);
  }
);

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
