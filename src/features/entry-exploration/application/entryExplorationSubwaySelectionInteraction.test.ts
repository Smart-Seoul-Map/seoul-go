import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as THREE from "three";

import { LINE2_SELECTION_ANIMATION_DURATION_MS } from "../config/line2SelectionConfig";
import { createEntryExplorationSubwaySelectionInteractionController } from "./entryExplorationSubwaySelectionInteraction";

describe("createEntryExplorationSubwaySelectionInteractionController", () => {
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

  test("activates only after the character enters the trigger", () => {
    const controller = createEntryExplorationSubwaySelectionInteractionController();

    expect(controller.canActivate()).toBe(false);

    controller.updateTriggerState({ x: 8, z: 6 });

    expect(controller.canActivate()).toBe(true);

    controller.activate(0);

    expect(controller.isActive()).toBe(true);
    expect(controller.canActivate()).toBe(false);

    controller.dispose();
  });

  test("moves the camera to the subway selection preset", () => {
    const onStateChange = vi.fn();
    const controller = createEntryExplorationSubwaySelectionInteractionController({
      onStateChange,
    });
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    controller.updateTriggerState({ x: 8, z: 6 });
    controller.activate(100);
    controller.updateCamera(camera, 1000);

    expect(controller.getState().isCameraReady).toBe(true);
    expect(camera.zoom).toBe(1.45);
    expect(onStateChange).toHaveBeenCalled();

    controller.dispose();
  });

  test("selects a station through the scene update loop", () => {
    const controller = createEntryExplorationSubwaySelectionInteractionController({
      random: () => 0,
    });
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    controller.updateTriggerState({ x: 8, z: 6 });
    controller.activate(0);
    controller.updateCamera(camera, 900);
    controller.selectStation(1000);

    expect(controller.getState().status).toBe("selecting");

    controller.update(1000 + LINE2_SELECTION_ANIMATION_DURATION_MS);

    expect(controller.getState().status).toBe("selected");
    expect(controller.getState().selectedStation?.id).toBe("201");

    controller.dispose();
  });

  test("requires trigger exit before reactivation", () => {
    const controller = createEntryExplorationSubwaySelectionInteractionController();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    controller.updateTriggerState({ x: 8, z: 6 });
    controller.activate(0);
    controller.deactivate(100);

    expect(controller.getState().isActive).toBe(false);
    expect(controller.isActive()).toBe(true);
    expect(controller.canActivate()).toBe(false);

    controller.updateCamera(camera, 1000);
    controller.updateTriggerState({ x: 20, z: 20 });
    controller.updateTriggerState({ x: 8, z: 6 });

    expect(controller.isActive()).toBe(false);
    expect(controller.canActivate()).toBe(true);

    controller.dispose();
  });
});
