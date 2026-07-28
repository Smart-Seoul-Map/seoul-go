import { describe, expect, test } from "vitest";

import {
  createEntryExplorationDistrictSelectionCameraTarget,
  ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG,
  ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET,
} from "../config/entryExplorationDistrictSelectionEvent";
import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";

describe("entryExplorationDistrictJumpSelectionInteraction", () => {
  test("waits for the character to leave the trigger before reactivating after deactivate", () => {
    const scene = createEntryExplorationDistrictJumpSelectionInteractionController();
    const triggerPosition = {
      x:
        ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpMapPosition.x +
        ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpStartPoint.x,
      z:
        ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpMapPosition.z +
        ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpStartPoint.y,
    };
    const outsideTriggerPosition = {
      x: triggerPosition.x + ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.triggerRadius + 1,
      z: triggerPosition.z,
    };

    scene.updateTriggerState(triggerPosition);

    expect(scene.canActivate()).toBe(true);

    scene.activate(0);
    scene.deactivate();

    scene.updateTriggerState(triggerPosition);
    expect(scene.canActivate()).toBe(false);

    scene.updateTriggerState(outsideTriggerPosition);
    expect(scene.canActivate()).toBe(false);

    scene.updateTriggerState(triggerPosition);
    expect(scene.canActivate()).toBe(true);

    scene.dispose();
  });

  test("resolves camera target from the district map root and camera preset offsets", () => {
    const rootPosition = {
      x: ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpMapPosition.x,
      y: 0,
      z: ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpMapPosition.z,
    };
    const target = createEntryExplorationDistrictSelectionCameraTarget(
      rootPosition,
      ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET
    );

    expect(target.toPosition.x).toBeCloseTo(
      rootPosition.x + ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.positionOffset.x
    );
    expect(target.toPosition.y).toBeCloseTo(
      rootPosition.y + ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.positionOffset.y
    );
    expect(target.toPosition.z).toBeCloseTo(
      rootPosition.z + ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.positionOffset.z
    );
    expect(target.toLookAt.x).toBeCloseTo(
      rootPosition.x + ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.lookAtOffset.x
    );
    expect(target.toLookAt.y).toBeCloseTo(
      rootPosition.y + ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.lookAtOffset.y
    );
    expect(target.toLookAt.z).toBeCloseTo(
      rootPosition.z + ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.lookAtOffset.z
    );
    expect(target.toZoom).toBe(ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET.zoom);
  });
});
