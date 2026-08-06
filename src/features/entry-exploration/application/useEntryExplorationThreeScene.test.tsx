import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import * as THREE from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { useEntryExplorationThreeScene } from "./useEntryExplorationThreeScene";

const mocks = vi.hoisted(() => {
  const domElement = document.createElement("canvas");
  const movement = {
    getCurrentPosition: vi.fn(() => ({ x: 4, z: 5 })),
    headingRadians: 0,
    modelKey: "idlePrimary",
    moveTo: vi.fn(),
    stop: vi.fn(),
  };
  const cancelPendingIntroRefresh = vi.fn();
  const setIntroButtonPressed = vi.fn();
  const registry = {
    activateReadySceneInteraction: vi.fn(() => false),
    addSceneInteractionObjects: vi.fn(),
    clearSceneInteractionControllers: vi.fn(),
    deactivateActiveSceneInteraction: vi.fn(() => true),
    disposeSceneInteractionControllers: vi.fn(),
    handleSceneInteractionPointerDown: vi.fn(() => false),
    handleSceneInteractionPointerMove: vi.fn(() => false),
    handleSceneInteractionPointerUp: vi.fn(() => false),
    hasActiveSceneInteraction: vi.fn(() => true),
    registerSceneInteractionControllers: vi.fn(),
    retryActiveSceneInteraction: vi.fn(() => false),
    setSceneInteractionCharacter: vi.fn(),
    updateActiveSceneInteractionCamera: vi.fn(),
    updateSceneInteractions: vi.fn(),
    updateSceneInteractionTriggers: vi.fn(),
  };
  const updateEntryExplorationCameraFocus = vi.fn();

  return {
    camera: null as THREE.OrthographicCamera | null,
    domElement,
    floor: null as THREE.Mesh | null,
    introButtonMesh: null as THREE.Mesh | null,
    introFloorObject: null as THREE.Group | null,
    movement,
    movementOptions: null as {
      onArrive?: (arrival: {
        position: { x: number; z: number };
        target: { x: number; z: number };
      }) => void;
    } | null,
    registry,
    cancelPendingIntroRefresh,
    setIntroButtonPressed,
    updateEntryExplorationCameraFocus,
  };
});

vi.mock("@shared/lib/character/useCharacterMovementController", () => ({
  useCharacterMovementController: (options: typeof mocks.movementOptions) => {
    mocks.movementOptions = options;

    return mocks.movement;
  },
}));

vi.mock("@shared/lib/character/characterAnimationPlayer", () => ({
  playCharacterAnimationClips: vi.fn(() => []),
  stopCharacterAnimationActions: vi.fn(),
}));

vi.mock("./entryExplorationGltfLoader", () => ({
  loadEntryExplorationGltf: vi.fn(() =>
    Promise.resolve({
      animations: [],
      scene: new THREE.Group(),
    })
  ),
}));

vi.mock("./entryExplorationIntroFloor", async () => {
  const three = await vi.importActual<typeof import("three")>("three");

  mocks.introButtonMesh = new three.Mesh(
    new three.PlaneGeometry(1, 1),
    new three.MeshBasicMaterial()
  );
  mocks.introFloorObject = new three.Group();

  return {
    createEntryExplorationIntroFloor: () => ({
      buttonMesh: mocks.introButtonMesh,
      cancelPendingRefresh: mocks.cancelPendingIntroRefresh,
      object: mocks.introFloorObject,
      setButtonPressed: mocks.setIntroButtonPressed,
    }),
  };
});

vi.mock("./entryExplorationThreeScene", async () => {
  const three = await vi.importActual<typeof import("three")>("three");

  mocks.camera = new three.OrthographicCamera();
  mocks.floor = new three.Mesh(new three.PlaneGeometry(10, 10), new three.MeshBasicMaterial());

  return {
    addEntryExplorationLights: vi.fn(),
    createEntryExplorationCamera: vi.fn(() => mocks.camera),
    createEntryExplorationFloorMesh: vi.fn(() => mocks.floor),
    createEntryExplorationRenderer: vi.fn(() => ({
      dispose: vi.fn(),
      domElement: mocks.domElement,
      forceContextLoss: vi.fn(),
      render: vi.fn(),
      setSize: vi.fn(),
    })),
    createEntryExplorationSceneObject: vi.fn(() => new three.Group()),
    disposeEntryExplorationObject3D: vi.fn(),
    fitEntryExplorationCharacterModel: vi.fn(),
    resizeEntryExplorationCamera: vi.fn(),
    updateEntryExplorationCameraFocus: mocks.updateEntryExplorationCameraFocus,
    updateEntryExplorationCameraView: vi.fn(),
  };
});

vi.mock("./useEntryExplorationSceneInteractionRegistry", async () => {
  const actual = await vi.importActual<
    typeof import("./useEntryExplorationSceneInteractionRegistry")
  >("./useEntryExplorationSceneInteractionRegistry");

  return {
    ...actual,
    useEntryExplorationSceneInteractionRegistry: () => mocks.registry,
  };
});

function createContainerRef(): RefObject<HTMLDivElement | null> {
  const container = document.createElement("div");

  Object.defineProperty(container, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    }),
  });
  Object.defineProperty(mocks.domElement, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    }),
  });

  return { current: container };
}

describe("useEntryExplorationThreeScene", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("WebGLRenderingContext", function WebGLRenderingContext() {});
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  test("starts once from the floor button and keeps the camera locked while the character enters", async () => {
    const containerRef = createContainerRef();
    const intersectObject = vi
      .spyOn(THREE.Raycaster.prototype, "intersectObject")
      .mockImplementation((object) =>
        object === mocks.introButtonMesh ? ([{}] as THREE.Intersection[]) : []
      );

    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        containerRef,
        createSceneInteractionControllers: () => [],
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      mocks.domElement.dispatchEvent(new PointerEvent("pointerdown"));
      mocks.domElement.dispatchEvent(new PointerEvent("pointerdown"));
    });

    expect(mocks.setIntroButtonPressed).toHaveBeenCalledTimes(1);
    expect(mocks.domElement.getAttribute("aria-busy")).toBe("true");
    expect(mocks.domElement.getAttribute("aria-disabled")).toBe("true");
    expect(mocks.movement.moveTo).toHaveBeenCalledTimes(1);
    expect(mocks.movement.moveTo).toHaveBeenCalledWith(
      ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition
    );
    expect(mocks.updateEntryExplorationCameraFocus).not.toHaveBeenCalled();

    intersectObject.mockRestore();
    unmount();
    expect(mocks.cancelPendingIntroRefresh).toHaveBeenCalledTimes(1);
  });

  test("deactivates the active interaction instead of moving when the user clicks the floor outside the interaction", async () => {
    const containerRef = createContainerRef();
    const floorHitPoint = new THREE.Vector3(8, 0, 9);
    const intersectObject = vi
      .spyOn(THREE.Raycaster.prototype, "intersectObject")
      .mockReturnValue([{ point: floorHitPoint } as THREE.Intersection]);

    renderHook(() =>
      useEntryExplorationThreeScene({
        containerRef,
        createSceneInteractionControllers: () => [],
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      mocks.domElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    act(() => {
      mocks.movementOptions?.onArrive?.({
        position: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition,
        target: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition,
      });
    });

    expect(mocks.domElement.getAttribute("aria-busy")).toBeNull();
    expect(mocks.domElement.getAttribute("aria-disabled")).toBeNull();
    expect(mocks.domElement.getAttribute("role")).toBeNull();
    expect(mocks.domElement.tabIndex).toBe(-1);

    mocks.updateEntryExplorationCameraFocus.mockClear();
    mocks.movement.moveTo.mockClear();

    act(() => {
      mocks.domElement.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 50,
          clientY: 50,
        })
      );
    });

    expect(mocks.registry.deactivateActiveSceneInteraction).toHaveBeenCalledTimes(1);
    expect(mocks.updateEntryExplorationCameraFocus).toHaveBeenLastCalledWith(mocks.camera, {
      x: 4,
      z: 5,
    });
    expect(mocks.movement.moveTo).not.toHaveBeenCalled();

    intersectObject.mockRestore();
  });
});
