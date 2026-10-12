import * as THREE from "three";
import { expect, test } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import {
  createEntryExplorationIntroFloor,
  getIntroBackgroundWidth,
  isEntryExplorationIntroTitleUv,
} from "./entryExplorationIntroFloor";

const { camera, targetPosition } = ENTRY_EXPLORATION_SCENE_CONFIG.intro;

test.each([
  [1920, 1080],
  [1440, 900],
])("keeps the full intro background width at %ix%i", (width, height) => {
  expect(getIntroBackgroundWidth(width / height)).toBeGreaterThanOrEqual(20);
});

test.each([
  [390, 844],
  [360, 844],
  [820, 1180],
])("fits the intro background inside the visible width at %ix%i", (width, height) => {
  const aspect = width / height;
  const visibleWidth = (ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize * aspect) / camera.zoom;

  expect(getIntroBackgroundWidth(aspect)).toBeLessThan(visibleWidth);
  expect(getIntroBackgroundWidth(aspect)).toBeLessThan(22);
});

test("scales the intro background around the arrival point so the title button stays under it", () => {
  const introFloor = createEntryExplorationIntroFloor();
  const aspect = 390 / 844;

  introFloor.applyLayout(ENTRY_INTRO_LAYOUTS.mobile, aspect);

  const [mesh] = introFloor.object.children;
  const point = ENTRY_INTRO_LAYOUTS.mobile.objects["intro-background"];
  const scale = getIntroBackgroundWidth(aspect) / 22;
  expect(mesh).toBeInstanceOf(THREE.Mesh);
  expect(mesh.scale.x).toBeCloseTo(scale);
  expect(mesh.scale.y).toBeCloseTo(scale);
  expect(mesh.position.x).toBeCloseTo(targetPosition.x + (point.x - targetPosition.x) * scale);
  expect(mesh.position.z).toBeCloseTo(targetPosition.z + (point.z - targetPosition.z) * scale);
  expect(introFloor.getCenter()).toEqual({ x: mesh.position.x, z: mesh.position.z });
});

test("accepts the center of the title button", () => {
  expect(isEntryExplorationIntroTitleUv({ x: 0.4875, y: 1 - 0.65 })).toBe(true);
});

test.each([
  ["the top-left decoration", { x: 0.2, y: 0.9 }],
  ["the landmark above the button", { x: 0.5, y: 0.75 }],
  ["the bottom mailbox", { x: 0.1, y: 0.15 }],
  ["the empty area right of the button", { x: 0.9, y: 0.35 }],
])("rejects %s", (_name, uv) => {
  expect(isEntryExplorationIntroTitleUv(uv)).toBe(false);
});
