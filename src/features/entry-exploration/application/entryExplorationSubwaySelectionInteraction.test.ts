import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as THREE from "three";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { LINE2_SELECTION_ANIMATION_DURATION_MS } from "../config/line2SelectionConfig";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID,
} from "../config/entryExplorationSceneObjects";
import { createEntryExplorationSubwaySelectionInteractionController } from "./entryExplorationSubwaySelectionInteraction";

const subwayMapObject = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
  (object) => object.id === ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID
);

if (!subwayMapObject) {
  throw new Error("Subway route map scene object is required.");
}

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

    controller.updateTriggerState(subwayMapObject.position);

    expect(controller.canActivate()).toBe(true);

    controller.activate(0);

    expect(controller.isActive()).toBe(true);
    expect(controller.canActivate()).toBe(false);

    controller.dispose();
  });

  test("provides a destination slightly left of the route map center", () => {
    const controller = createEntryExplorationSubwaySelectionInteractionController();

    expect(controller.getActivationCharacterDestination?.()).toEqual({
      x: subwayMapObject.position.x - 0.85,
      z: subwayMapObject.position.z + 0.85,
    });

    controller.dispose();
  });

  test("moves the camera to the subway selection preset", () => {
    const onStateChange = vi.fn();
    const controller = createEntryExplorationSubwaySelectionInteractionController({
      onStateChange,
    });
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    controller.updateTriggerState(subwayMapObject.position);
    controller.activate(100);
    controller.updateCamera(camera, 1000, subwayMapObject.position);

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

    controller.updateTriggerState(subwayMapObject.position);
    controller.activate(0);
    controller.updateCamera(camera, 900, subwayMapObject.position);
    controller.selectStation(1000);

    expect(controller.getState().status).toBe("selecting");
    expect(controller.getState().selectedStation?.id).toBe("201");

    controller.update(1000 + LINE2_SELECTION_ANIMATION_DURATION_MS);

    expect(controller.getState().status).toBe("selected");
    expect(controller.getState().selectedStation?.id).toBe("201");

    controller.dispose();
  });

  test("requires trigger exit before reactivation", () => {
    const controller = createEntryExplorationSubwaySelectionInteractionController();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    controller.updateTriggerState(subwayMapObject.position);
    controller.activate(0);
    controller.deactivate(100);

    expect(controller.getState().isActive).toBe(false);
    expect(controller.isActive()).toBe(true);
    expect(controller.canActivate()).toBe(false);

    controller.updateCamera(camera, 1000, subwayMapObject.position);
    controller.updateTriggerState({ x: 20, z: 20 });
    controller.updateTriggerState(subwayMapObject.position);

    expect(controller.isActive()).toBe(false);
    expect(controller.canActivate()).toBe(true);

    controller.dispose();
  });

  test("returns the camera to the current character position", () => {
    const controller = createEntryExplorationSubwaySelectionInteractionController();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    const characterPosition = controller.getActivationCharacterDestination?.();

    if (!characterPosition) {
      throw new Error("Subway selection character destination is required.");
    }

    controller.updateTriggerState(subwayMapObject.position);
    controller.activate(0);
    controller.updateCamera(camera, 900, characterPosition);
    controller.deactivate(1000);
    controller.updateCamera(camera, 1900, characterPosition);

    expect(camera.position.x).toBeCloseTo(
      characterPosition.x + ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset.x
    );
    expect(camera.position.y).toBeCloseTo(ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset.y);
    expect(camera.position.z).toBeCloseTo(
      characterPosition.z + ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset.z
    );
    expect(camera.zoom).toBe(1);

    controller.dispose();
  });
});
