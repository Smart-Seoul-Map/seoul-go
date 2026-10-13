import { describe, expect, test } from "vitest";
import * as THREE from "three";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "./entryExplorationSceneConfig";

describe("entry exploration scene config", () => {
  test("keeps the floor larger than the initial camera view", () => {
    expect(ENTRY_EXPLORATION_SCENE_CONFIG.floorSize).toBeGreaterThan(
      ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize * 20
    );
  });

  test("keeps the paper grid density consistent on the larger floor", () => {
    expect(ENTRY_EXPLORATION_SCENE_CONFIG.floorTextureRepeat).toBeGreaterThan(100);
  });

  test("keeps the character shadow visible across the exploration floor", () => {
    expect(ENTRY_EXPLORATION_SCENE_CONFIG.shadowCameraSize).toBeGreaterThanOrEqual(
      ENTRY_EXPLORATION_SCENE_CONFIG.floorSize
    );
  });

  test("looks straight down at the floor in the intro scene", () => {
    const { x, y, z } = ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.offset;
    const elevationDegrees = THREE.MathUtils.radToDeg(Math.atan2(y, Math.hypot(x, z)));

    expect(elevationDegrees).toBeGreaterThanOrEqual(85);
  });

  test("keeps the exploration camera at a three-quarter isometric angle", () => {
    const { x, y, z } = ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset;
    const elevationDegrees = THREE.MathUtils.radToDeg(Math.atan2(y, Math.hypot(x, z)));

    expect(elevationDegrees).toBeGreaterThanOrEqual(30);
    expect(elevationDegrees).toBeLessThanOrEqual(40);
  });
});
