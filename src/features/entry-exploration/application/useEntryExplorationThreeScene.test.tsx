import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import * as THREE from "three";
import { beforeEach, describe, expect, onTestFinished, test, vi } from "vitest";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { createEntryExplorationPlaceVisit } from "../domain/entryExplorationPlaceVisit";
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
    releaseInactiveSceneInteraction: vi.fn(() => false),
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

  mocks.introFloorObject = new three.Group();

  return {
    createEntryExplorationIntroFloor: () => ({
      cancelPendingRefresh: mocks.cancelPendingIntroRefresh,
      object: mocks.introFloorObject,
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
    mocks.movement.getCurrentPosition.mockReturnValue({ x: 4, z: 5 });
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(true);
    vi.stubGlobal("WebGLRenderingContext", function WebGLRenderingContext() {});
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  test("starts once from the exposed intro control and keeps the camera locked while the character enters", async () => {
    const containerRef = createContainerRef();
    let startIntro: (() => boolean) | null = null;

    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        containerRef,
        createSceneInteractionControllers: () => [],
        onSceneControlsReady: (controls) => {
          startIntro = controls?.startIntro ?? null;
        },
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.introFloorObject?.parent).toBeTruthy();

    act(() => {
      startIntro?.();
      startIntro?.();
    });

    expect(mocks.domElement.getAttribute("aria-busy")).toBe("true");
    expect(mocks.domElement.getAttribute("aria-disabled")).toBe("true");
    expect(mocks.movement.moveTo).toHaveBeenCalledTimes(1);
    expect(mocks.updateEntryExplorationCameraFocus).not.toHaveBeenCalled();

    unmount();
    expect(mocks.cancelPendingIntroRefresh).toHaveBeenCalledTimes(1);
  });

  test("positions the tower using the viewport at start and keeps it fixed after resizing", async () => {
    const containerRef = createContainerRef();
    let startIntro: (() => boolean) | undefined;
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        containerRef,
        createSceneInteractionControllers: () => [],
        onSceneControlsReady: (controls) => {
          startIntro = controls?.startIntro;
        },
      })
    );
    await act(async () => {
      await Promise.resolve();
    });
    const tower = mocks.introFloorObject?.parent?.getObjectByName("entry-atlas-tower");
    if (!tower || !containerRef.current) {
      throw new Error("The entry scene is missing.");
    }
    const originalPosition = tower.position.clone();
    const viewport = vi.spyOn(containerRef.current, "getBoundingClientRect");
    viewport.mockReturnValue(new DOMRect(0, 0, 375, 812));

    act(() => {
      startIntro?.();
    });
    const placedPosition = tower.position.clone();
    expect(placedPosition.equals(originalPosition)).toBe(false);
    const expectedScreenRight = (19 / 2) * (375 / 812) * 0.9;
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    expect((placedPosition.x - arrival.x - placedPosition.z + arrival.z) / Math.SQRT2).toBeCloseTo(
      expectedScreenRight
    );

    viewport.mockReturnValue(new DOMRect(0, 0, 1440, 900));
    act(() => {
      window.dispatchEvent(new Event("resize"));
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
      startIntro?.();
    });
    expect(tower.position.equals(placedPosition)).toBe(true);
    viewport.mockRestore();
    unmount();
  });

  test("draws the guide only after intro arrival and disposes it on unmount", async () => {
    const containerRef = createContainerRef();
    let startIntro: (() => boolean) | undefined;
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        containerRef,
        createSceneInteractionControllers: () => [],
        onSceneControlsReady: (controls) => {
          startIntro = controls?.startIntro;
        },
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro?.();
    });
    const guide = mocks.introFloorObject?.parent?.getObjectByName("entry-guide-arrow");
    expect(guide).toBeDefined();
    expect(guide?.visible).toBe(false);
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    act(() => {
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
    });
    expect(guide?.visible).toBe(true);
    const frame = vi.mocked(requestAnimationFrame).mock.calls[0]?.[0];
    act(() => {
      frame?.(performance.now() + 10000);
    });
    const head = guide?.getObjectByName("entry-guide-head");
    expect(head?.visible).toBe(true);
    if (!(head instanceof THREE.Mesh)) throw new Error("The guide head is missing.");
    const dispose = vi.spyOn(head.geometry, "dispose");
    unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });

  test("opens at the guide destination, stops once, and rearms only after leaving", async () => {
    const onOpenChange = vi.fn();
    const placeVisit = createEntryExplorationPlaceVisit({ radius: 1.2, onOpenChange });
    const containerRef = createContainerRef();
    let startIntro: (() => boolean) | undefined;
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        containerRef,
        createSceneInteractionControllers: () => [],
        placeVisit,
        onSceneControlsReady: (controls) => {
          startIntro = controls?.startIntro;
        },
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro?.();
    });
    const head = mocks.introFloorObject?.parent?.getObjectByName("entry-guide-head");
    if (!head) throw new Error("The guide head is missing.");
    const destination = { x: head.position.x, z: head.position.z };
    const frame = vi.mocked(requestAnimationFrame).mock.calls[0]?.[0];
    mocks.movement.getCurrentPosition.mockReturnValue(destination);
    act(() => {
      frame?.(performance.now());
    });
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => {
      const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
      frame?.(performance.now());
      frame?.(performance.now());
    });
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    expect(mocks.movement.stop).toHaveBeenCalledOnce();

    const intersect = vi
      .spyOn(THREE.Raycaster.prototype, "intersectObject")
      .mockReturnValue([
        { point: new THREE.Vector3(destination.x + 0.5, 0, destination.z) } as THREE.Intersection,
      ]);
    onTestFinished(() => intersect.mockRestore());
    act(() => {
      mocks.domElement.dispatchEvent(new PointerEvent("pointerdown", { clientX: 50, clientY: 50 }));
      frame?.(performance.now());
    });
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({
      x: destination.x + 0.5,
      z: destination.z,
    });
    mocks.movement.getCurrentPosition.mockReturnValue({ x: destination.x + 4, z: destination.z });
    act(() => {
      frame?.(performance.now());
    });
    mocks.movement.getCurrentPosition.mockReturnValue(destination);
    act(() => {
      frame?.(performance.now());
    });
    expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
    expect(mocks.movement.stop).toHaveBeenCalledTimes(2);
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
