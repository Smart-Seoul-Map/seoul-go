import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG } from "../config/entryExplorationDistrictSelectionEvent";
import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";

describe("createEntryExplorationSceneInteractionControllers", () => {
  test("creates the registered entry exploration interaction controllers", () => {
    const controllers = createEntryExplorationSceneInteractionControllers();

    expect(controllers).toHaveLength(1);
    expect(controllers[0]?.priority).toBeGreaterThan(0);
    expect(controllers[0]?.object).toBeDefined();
  });

  test("connects district selection result handler to registered controllers", () => {
    const handleDistrictSelectionResult = vi.fn();
    const controllers = createEntryExplorationSceneInteractionControllers({
      onDistrictSelectionResult: handleDistrictSelectionResult,
    });
    const controller = controllers[0];

    controller?.activate(0);
    controller?.object.updateMatrixWorld(true);
    controller?.handlePointerDown(createSelectionRaycaster(), 0);
    controller?.handlePointerUp(
      createSelectionRaycaster(),
      ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.chargeMaxDurationMs
    );
    controller?.update(
      ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.chargeMaxDurationMs +
        ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.bounceDurationMs
    );

    expect(handleDistrictSelectionResult).toHaveBeenCalledTimes(1);
  });
});

function createSelectionRaycaster(): THREE.Raycaster {
  const { jumpMapPosition } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;

  return new THREE.Raycaster(
    new THREE.Vector3(jumpMapPosition.x, 10, jumpMapPosition.z),
    new THREE.Vector3(0, -1, 0)
  );
}
