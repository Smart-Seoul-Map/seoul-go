import * as THREE from "three";
import { expect, test } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import {
  createEntryExplorationIntroFloor,
  getIntroBackgroundWidth,
} from "./entryExplorationIntroFloor";

test.each([
  [1920, 1080],
  [1440, 900],
])("keeps the full intro background width at %ix%i", (width, height) => {
  expect(getIntroBackgroundWidth(width / height)).toBe(22);
});

test.each([
  [390, 844],
  [360, 844],
  [820, 1180],
])("fits the intro background inside the visible width at %ix%i", (width, height) => {
  const aspect = width / height;
  const visibleWidth = ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize * aspect;

  expect(getIntroBackgroundWidth(aspect)).toBeLessThan(visibleWidth);
  expect(getIntroBackgroundWidth(aspect)).toBeLessThan(22);
});

test("scales the intro background plane and moves it to its layout point", () => {
  const introFloor = createEntryExplorationIntroFloor();
  const aspect = 390 / 844;

  introFloor.applyLayout(ENTRY_INTRO_LAYOUTS.mobile, aspect);

  const [mesh] = introFloor.object.children;
  const point = ENTRY_INTRO_LAYOUTS.mobile.objects["intro-background"];
  expect(mesh).toBeInstanceOf(THREE.Mesh);
  expect(mesh.position.x).toBe(point.x);
  expect(mesh.position.z).toBe(point.z);
  expect(mesh.scale.x).toBeCloseTo(getIntroBackgroundWidth(aspect) / 22);
  expect(mesh.scale.y).toBeCloseTo(mesh.scale.x);
});
