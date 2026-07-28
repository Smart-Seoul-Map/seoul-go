import { act, renderHook } from "@testing-library/react";
import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import {
  type EntryExplorationSceneInteractionController,
  useEntryExplorationSceneInteractionRegistry,
} from "./useEntryExplorationSceneInteractionRegistry";

function createSceneInteractionController(
  overrides: Partial<EntryExplorationSceneInteractionController> = {}
): EntryExplorationSceneInteractionController {
  return {
    activate: vi.fn(),
    canActivate: vi.fn(() => false),
    dispose: vi.fn(),
    handlePointerDown: vi.fn(() => false),
    handlePointerMove: vi.fn(() => false),
    handlePointerUp: vi.fn(() => false),
    isActive: vi.fn(() => true),
    object: new THREE.Group(),
    setCharacter: vi.fn(),
    update: vi.fn(),
    updateCamera: vi.fn(),
    updateTriggerState: vi.fn(),
    ...overrides,
  };
}

describe("useEntryExplorationSceneInteractionRegistry", () => {
  test("registers interaction controllers and activates the first ready one", () => {
    const inactiveController = createSceneInteractionController();
    const readyController = createSceneInteractionController({
      canActivate: vi.fn(() => true),
    });
    const onActivate = vi.fn();
    const { result } = renderHook(() => useEntryExplorationSceneInteractionRegistry());

    act(() => {
      result.current.registerSceneInteractionControllers([inactiveController, readyController]);
      result.current.updateSceneInteractionTriggers({ x: 1, z: 2 });
    });

    expect(inactiveController.updateTriggerState).toHaveBeenCalledWith({ x: 1, z: 2 });
    expect(readyController.updateTriggerState).toHaveBeenCalledWith({ x: 1, z: 2 });

    act(() => {
      expect(result.current.activateReadySceneInteraction(120, onActivate)).toBe(true);
    });

    expect(onActivate).toHaveBeenCalledWith(readyController);
    expect(inactiveController.activate).not.toHaveBeenCalled();
    expect(readyController.activate).toHaveBeenCalledWith(120);
    expect(result.current.hasActiveSceneInteraction()).toBe(true);

    act(() => {
      expect(result.current.activateReadySceneInteraction(240)).toBe(false);
    });
  });

  test("activates the highest priority ready controller", () => {
    const lowerPriorityController = createSceneInteractionController({
      canActivate: vi.fn(() => true),
      priority: 10,
    });
    const higherPriorityController = createSceneInteractionController({
      canActivate: vi.fn(() => true),
      priority: 20,
    });
    const { result } = renderHook(() => useEntryExplorationSceneInteractionRegistry());

    act(() => {
      result.current.registerSceneInteractionControllers([
        lowerPriorityController,
        higherPriorityController,
      ]);
    });

    act(() => {
      expect(result.current.activateReadySceneInteraction(120)).toBe(true);
    });

    expect(lowerPriorityController.activate).not.toHaveBeenCalled();
    expect(higherPriorityController.activate).toHaveBeenCalledWith(120);
  });

  test("releases a controller after it becomes inactive", () => {
    let isActive = true;
    const controller = createSceneInteractionController({
      canActivate: vi.fn(() => true),
      isActive: vi.fn(() => isActive),
    });
    const { result } = renderHook(() => useEntryExplorationSceneInteractionRegistry());

    act(() => {
      result.current.registerSceneInteractionControllers([controller]);
      result.current.activateReadySceneInteraction(120);
    });

    isActive = false;

    act(() => {
      expect(result.current.releaseInactiveSceneInteraction()).toBe(true);
    });

    expect(result.current.hasActiveSceneInteraction()).toBe(false);
  });

  test("routes pointer events, camera updates, and cleanup to registered controllers", () => {
    const scene = new THREE.Scene();
    const character = new THREE.Group();
    const camera = new THREE.OrthographicCamera();
    const raycaster = new THREE.Raycaster();
    const characterPosition = { x: 3, z: 4 };
    const controller = createSceneInteractionController({
      canActivate: vi.fn(() => true),
      handlePointerDown: vi.fn(() => true),
      handlePointerMove: vi.fn(() => true),
      handlePointerUp: vi.fn(() => true),
    });
    const { result } = renderHook(() => useEntryExplorationSceneInteractionRegistry());

    act(() => {
      result.current.registerSceneInteractionControllers([controller]);
      result.current.addSceneInteractionObjects(scene);
      result.current.setSceneInteractionCharacter(character);
      result.current.handleSceneInteractionPointerDown(raycaster, 10);
      result.current.handleSceneInteractionPointerMove(raycaster);
      result.current.handleSceneInteractionPointerUp(raycaster, 20);
      result.current.updateSceneInteractions(30);
    });

    expect(scene.children).toContain(controller.object);
    expect(controller.setCharacter).toHaveBeenCalledWith(character);
    expect(controller.handlePointerDown).toHaveBeenCalledWith(raycaster, 10);
    expect(controller.handlePointerMove).toHaveBeenCalledWith(raycaster);
    expect(controller.handlePointerUp).toHaveBeenCalledWith(raycaster, 20);
    expect(controller.update).toHaveBeenCalledWith(30);

    act(() => {
      result.current.activateReadySceneInteraction(40);
      result.current.updateActiveSceneInteractionCamera(camera, 50, characterPosition);
      result.current.disposeSceneInteractionControllers();
      result.current.clearSceneInteractionControllers();
    });

    expect(controller.updateCamera).toHaveBeenCalledWith(camera, 50, characterPosition);
    expect(controller.dispose).toHaveBeenCalled();
    expect(result.current.hasActiveSceneInteraction()).toBe(false);
  });
});
