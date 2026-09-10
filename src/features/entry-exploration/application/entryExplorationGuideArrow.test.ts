import * as THREE from "three";
import { afterEach, expect, onTestFinished, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { createEntryExplorationAtlasScenery } from "./entryExplorationAtlasScenery";
import { createEntryExplorationGuideArrow } from "./entryExplorationGuideArrow";
import {
  createEntryExplorationCamera,
  updateEntryExplorationCameraFocus,
} from "./entryExplorationThreeScene";

const origin = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
const options = { origin, destination: { x: 23, z: 15 }, color: "#ff2e94" };

afterEach(() => vi.restoreAllMocks());

test("waits for arrival, reveals dashes in order, then shows a directional arrowhead", () => {
  const guide = createEntryExplorationGuideArrow(options);
  onTestFinished(guide.dispose);
  const dashes = guide.object.getObjectByName("entry-guide-dashes");
  const head = guide.object.getObjectByName("entry-guide-head");
  if (!(dashes instanceof THREE.InstancedMesh) || !(head instanceof THREE.Mesh)) {
    throw new Error("The guide meshes are missing.");
  }
  expect(guide.object.visible).toBe(false);
  guide.update(1000);
  expect(dashes.count).toBe(0);
  guide.start(1000);
  guide.update(1300);
  const partialCount = dashes.count;
  expect(partialCount).toBeGreaterThan(0);
  expect(head.visible).toBe(false);
  guide.update(1600);
  expect(dashes.count).toBeGreaterThan(partialCount);
  expect(head.visible).toBe(true);
  expect(head.position.x).toBeCloseTo(guide.destination.x);
  expect(head.position.z).toBeCloseTo(guide.destination.z);
  const headDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(head.quaternion);
  expect(headDirection.x).toBeCloseTo(Math.SQRT1_2);
  expect(headDirection.z).toBeCloseTo(-Math.SQRT1_2);
  expect((head.material as THREE.MeshBasicMaterial).color.getHexString()).toBe("ff2e94");
  guide.start(10000);
  guide.update(10000);
  expect(head.visible).toBe(true);
});

test("shows the complete guide immediately for reduced motion and releases GPU resources", () => {
  const guide = createEntryExplorationGuideArrow(options);
  const dashes = guide.object.getObjectByName("entry-guide-dashes");
  const head = guide.object.getObjectByName("entry-guide-head");
  if (!(dashes instanceof THREE.InstancedMesh) || !(head instanceof THREE.Mesh)) {
    throw new Error("The guide meshes are missing.");
  }
  const dashDispose = vi.spyOn(dashes.geometry, "dispose");
  const headDispose = vi.spyOn(head.geometry, "dispose");
  const materialDispose = vi.spyOn(head.material as THREE.Material, "dispose");
  guide.start(0, true);
  expect(dashes.count).toBeGreaterThan(0);
  expect(head.visible).toBe(true);
  guide.dispose();
  expect(dashDispose).toHaveBeenCalledOnce();
  expect(headDispose).toHaveBeenCalledOnce();
  expect(materialDispose).toHaveBeenCalledOnce();
});

test.each([
  [1440, 900],
  [853, 872],
  [375, 812],
  [390, 844],
])("aligns the arrowhead with the visible hanok base at %ix%i", (width, height) => {
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(new THREE.Texture());
  const scenery = createEntryExplorationAtlasScenery();
  onTestFinished(scenery.dispose);
  scenery.positionLandmarksAtEntry(width / height);
  const hanok = scenery.object.getObjectByName("entry-atlas-hanok");
  if (!(hanok instanceof THREE.Mesh)) throw new Error("The hanok is missing.");
  const guide = createEntryExplorationGuideArrow({
    origin,
    destination: { x: hanok.position.x, z: hanok.position.z },
    color: "#ff2e94",
  });
  onTestFinished(guide.dispose);
  const camera = createEntryExplorationCamera(width, height);
  updateEntryExplorationCameraFocus(camera, guide.destination);
  camera.updateMatrixWorld();
  hanok.updateWorldMatrix(true, false);
  const positions = hanok.geometry.getAttribute("position");
  const bounds = new THREE.Box3();
  for (let index = 0; index < positions.count; index += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positions, index);
    bounds.expandByPoint(hanok.localToWorld(vertex).project(camera));
  }
  const head = guide.object.getObjectByName("entry-guide-head");
  if (!head) throw new Error("The arrowhead is missing.");
  const headScreen = head.position.clone().project(camera);
  expect(headScreen.x).toBeCloseTo(bounds.getCenter(new THREE.Vector3()).x, 2);
  expect(headScreen.y).toBeCloseTo(bounds.min.y, 2);
  expect(bounds.max.y).toBeLessThan(1);
  expect(bounds.min.x).toBeGreaterThan(-1);
  expect(bounds.max.x).toBeLessThan(1);
});
