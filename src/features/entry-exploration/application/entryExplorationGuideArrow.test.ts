import * as THREE from "three";
import { afterEach, expect, onTestFinished, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { getEntryEditionPosition } from "../domain/entryEditionLayout";
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
  [375, 812],
  [390, 844],
])("aligns the guide with the first API place at %ix%i", (width, height) => {
  const destination = getEntryEditionPosition(0, width / height);
  const guide = createEntryExplorationGuideArrow({ origin, destination, color: "#ff2e94" });
  onTestFinished(guide.dispose);
  const camera = createEntryExplorationCamera(width, height);
  updateEntryExplorationCameraFocus(camera, destination);
  camera.updateMatrixWorld();
  const head = guide.object.getObjectByName("entry-guide-head");
  if (!head) throw new Error("The arrowhead is missing.");
  const projected = head.position.clone().project(camera);
  expect(projected.x).toBeCloseTo(0, 2);
  expect(Math.abs(projected.y)).toBeLessThan(0.05);
  expect(head.position.x).toBeCloseTo(destination.x);
  expect(head.position.z).toBeCloseTo(destination.z);
});
