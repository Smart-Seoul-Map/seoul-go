import { describe, expect, test } from "vitest";

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
});
