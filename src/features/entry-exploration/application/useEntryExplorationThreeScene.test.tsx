import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import * as THREE from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";

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
    movement,
    registry,
    updateEntryExplorationCameraFocus,
  };
});

vi.mock("@shared/lib/character/useCharacterMovementController", () => ({
  useCharacterMovementController: () => mocks.movement,
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

  test("deactivates the active interaction instead of moving when the user clicks the floor outside the interaction", () => {
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

    mocks.updateEntryExplorationCameraFocus.mockClear();

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
