import * as THREE from "three";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG } from "../config/entryExplorationDistrictSelectionEvent";
import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

describe("createEntryExplorationSceneInteractionControllers", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      arc: vi.fn(),
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      lineWidth: 0,
      strokeRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates the registered entry exploration interaction controllers", () => {
    const controllers = createEntryExplorationSceneInteractionControllers();

    expect(controllers).toHaveLength(2);
    expect(controllers.every((controller) => (controller.priority ?? 0) > 0)).toBe(true);
    expect(controllers.every((controller) => controller.object !== undefined)).toBe(true);

    controllers.forEach((controller) => {
      controller.dispose();
    });
  });

  test("appends extra interaction controllers", () => {
    const extraController = {
      dispose: vi.fn(),
      object: new THREE.Group(),
    } as unknown as EntryExplorationSceneInteractionController;
    const controllers = createEntryExplorationSceneInteractionControllers({
      extraControllers: [extraController],
    });

    expect(controllers).toHaveLength(3);
    expect(controllers[2]).toBe(extraController);

    controllers.forEach((controller) => {
      controller.dispose();
    });
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

    controllers.forEach((controller) => {
      controller.dispose();
    });
  });
});

function createSelectionRaycaster(): THREE.Raycaster {
  const { jumpMapPosition } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;

  return new THREE.Raycaster(
    new THREE.Vector3(jumpMapPosition.x, 10, jumpMapPosition.z),
    new THREE.Vector3(0, -1, 0)
  );
}
