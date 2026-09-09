import * as THREE from "three";
import { afterEach, beforeEach, expect, onTestFinished, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { ENTRY_EXPLORATION_SCENE_OBJECTS } from "../config/entryExplorationSceneObjects";
import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";
import {
  createEntryExplorationCamera,
  createEntryExplorationSceneObject,
  disposeEntryExplorationObject3D,
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
  [853, 872],
  [375, 812],
])("keeps both selection maps below and left of the initial view at %ix%i", (width, height) => {
  const district = createEntryExplorationDistrictJumpSelectionInteractionController();
  const subway = createEntryExplorationSceneObject(ENTRY_EXPLORATION_SCENE_OBJECTS[0]);
  onTestFinished(() => {
    district.dispose();
    disposeEntryExplorationObject3D(subway);
  });
  const camera = createEntryExplorationCamera(width, height);
  updateEntryExplorationCameraFocus(camera, ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition);
  camera.updateMatrixWorld();

  for (const object of [district.object, subway]) {
    const bounds = new THREE.Box3()
      .setFromObject(object)
      .applyMatrix4(camera.matrixWorldInverse)
      .applyMatrix4(camera.projectionMatrix);
    expect(bounds.max.y).toBeLessThan(-1);
    expect(bounds.max.x).toBeLessThan(0);
  }
});
