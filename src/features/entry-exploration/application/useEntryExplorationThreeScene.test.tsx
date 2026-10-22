import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import * as THREE from "three";
import { beforeEach, describe, expect, onTestFinished, test, vi } from "vitest";

import {
  ENTRY_ASSET_PLACE_ARRIVAL_RADIUS,
  type EntryAssetPlaceId,
} from "../config/entryAssetPlaces";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { createEntryExplorationPlaceVisit } from "../domain/entryExplorationPlaceVisit";
import { resolveEntryIntroLayout } from "../domain/entryIntroLayout";
import { useEntryExplorationPlacePanel } from "./useEntryExplorationPlacePanel";
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
    getSceneInteractionPointerDestination: vi.fn<() => { x: number; z: number } | null>(() => null),
    handleSceneInteractionPointerDown: vi.fn(() => false),
    handleSceneInteractionPointerMove: vi.fn(() => false),
    handleSceneInteractionPointerUp: vi.fn(() => false),
    hasActiveSceneInteraction: vi.fn(() => true),
    releaseInactiveSceneInteraction: vi.fn(() => false),
    registerSceneInteractionControllers: vi.fn(),
    setSceneInteractionCharacter: vi.fn(),
    setSceneInteractionLayout: vi.fn(),
    takeSceneInteractionCharacterDestination: vi.fn<() => { x: number; z: number } | null>(
      () => null
    ),
    updateActiveSceneInteractionCamera: vi.fn(),
    updateSceneInteractions: vi.fn(),
    updateSceneInteractionTriggers: vi.fn(),
  };
  const updateEntryExplorationCameraFocus = vi.fn();

  return {
    camera: null as THREE.OrthographicCamera | null,
    domElement,
    floor: null as THREE.Mesh | null,
    introFloorApplyLayout: vi.fn(),
    introFloorObject: null as THREE.Group | null,
    movement,
    movementOptions: null as {
      onArrive?: (arrival: {
        position: { x: number; z: number };
        target: { x: number; z: number };
      }) => void;
    } | null,
    registry,
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
      applyLayout: mocks.introFloorApplyLayout,
      getCenter: () => ({ x: 0, z: 0 }),
      object: mocks.introFloorObject,
    }),
    isEntryExplorationIntroTitleUv: () => true,
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
    getEntryExplorationFacingQuaternion: vi.fn(() => new three.Quaternion()),
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

function startIntro(): void {
  mocks.domElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
}

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

function clickScene(): void {
  act(() => {
    mocks.domElement.dispatchEvent(new PointerEvent("pointerdown", { clientX: 50, clientY: 50 }));
  });
}

// Renders the scene with the real place panel wiring and finishes the intro walk.
async function renderAssetPlaceScene() {
  const containerRef = createContainerRef();
  const createSceneInteractionControllers = () => [];
  const { result, unmount } = renderHook(() => {
    const { placeVisits, panelProps, dismissOpenPanel } =
      useEntryExplorationPlacePanel(ENTRY_TEST_PLACES);
    useEntryExplorationThreeScene({
      places: ENTRY_TEST_PLACES,
      containerRef,
      createSceneInteractionControllers,
      placeVisits,
      onPlacePanelDismiss: dismissOpenPanel,
    });

    return panelProps;
  });
  onTestFinished(unmount);
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    startIntro();
  });
  const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
  act(() => {
    mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
  });
  mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
  mocks.movement.moveTo.mockClear();
  mocks.movement.stop.mockClear();
  const frame = vi.mocked(requestAnimationFrame).mock.calls[0]?.[0];

  return {
    panel: result,
    getAsset(placeId: EntryAssetPlaceId): THREE.Object3D {
      const asset = mocks.introFloorObject?.parent?.getObjectByName(`entry-scenery-${placeId}`);
      if (!asset) throw new Error(`The ${placeId} asset is missing.`);
      return asset;
    },
    renderFrameAt(position: { x: number; z: number }): void {
      mocks.movement.getCurrentPosition.mockReturnValue(position);
      act(() => {
        frame?.(performance.now());
      });
    },
  };
}

function mockSceneHits({
  editionPlace = null,
  assetName = null,
  floorPoint,
}: {
  editionPlace?: THREE.Object3D | null;
  assetName?: string | null;
  floorPoint: { x: number; z: number };
}) {
  const hits = { editionPlace, assetName };
  const intersectObject = vi
    .spyOn(THREE.Raycaster.prototype, "intersectObject")
    .mockImplementation((object) => {
      if (object === mocks.floor) {
        return [{ object, distance: 3, point: new THREE.Vector3(floorPoint.x, 0, floorPoint.z) }];
      }
      if (hits.editionPlace && object.name === "entry-edition-places") {
        return [{ object: hits.editionPlace, distance: 1, point: new THREE.Vector3() }];
      }
      return [];
    });
  const intersectObjects = vi
    .spyOn(THREE.Raycaster.prototype, "intersectObjects")
    .mockImplementation((objects) =>
      objects
        .filter((object) => object.name === hits.assetName)
        .map((object) => ({ object, distance: 2, point: new THREE.Vector3() }))
    );
  onTestFinished(() => {
    intersectObject.mockRestore();
    intersectObjects.mockRestore();
  });

  return { hits, intersectObjects };
}

describe("useEntryExplorationThreeScene", () => {
  test("consumes a background click that dismisses a place card before moving or opening another interaction", async () => {
    const dismiss = vi.fn(() => true);
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef: createContainerRef(),
        createSceneInteractionControllers: () => [],
        onPlacePanelDismiss: dismiss,
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro();
    });
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    act(() => {
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
    });
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
    mocks.registry.getSceneInteractionPointerDestination.mockReturnValue({ x: -3, z: 5 });
    mocks.movement.moveTo.mockClear();
    mocks.registry.handleSceneInteractionPointerDown.mockClear();
    act(() => {
      mocks.domElement.dispatchEvent(new MouseEvent("pointerdown", { clientX: 50, clientY: 50 }));
    });
    expect(dismiss).toHaveBeenCalledOnce();
    expect(mocks.movement.moveTo).not.toHaveBeenCalled();
    expect(mocks.registry.handleSceneInteractionPointerDown).not.toHaveBeenCalled();
    dismiss.mockReturnValue(false);
    act(() => {
      mocks.domElement.dispatchEvent(new MouseEvent("pointerdown", { clientX: 50, clientY: 50 }));
    });
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({ x: -3, z: 5 });
  });
  test("starts at the intro destination without opening a place card", async () => {
    const onOpenChange = vi.fn();
    const placeVisits = {
      [ENTRY_TEST_PLACES[1].id]: createEntryExplorationPlaceVisit({ radius: 2.4, onOpenChange }),
      [ENTRY_TEST_PLACES[0].id]: createEntryExplorationPlaceVisit({
        radius: 1.2,
        onOpenChange: vi.fn(),
      }),
    };
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef: createContainerRef(),
        createSceneInteractionControllers: () => [],
        placeVisits,
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro();
    });
    const target = mocks.movement.moveTo.mock.calls[0]?.[0] as { x: number; z: number };
    const destination = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    expect(Math.hypot(target.x - destination.x, target.z - destination.z)).toBeCloseTo(
      ENTRY_EXPLORATION_SCENE_CONFIG.arrivalRadius
    );
    act(() => {
      mocks.movementOptions?.onArrive?.({ position: destination, target });
    });
    expect(mocks.domElement.hasAttribute("aria-busy")).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
  test("moves to a clicked model's approach point instead of the floor behind it", async () => {
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef: createContainerRef(),
        createSceneInteractionControllers: () => [],
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro();
    });
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    act(() => {
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
    });
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
    mocks.registry.getSceneInteractionPointerDestination.mockReturnValueOnce({ x: -3, z: 5 });
    act(() => {
      mocks.domElement.dispatchEvent(new MouseEvent("pointerdown", { clientX: 50, clientY: 50 }));
    });
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({ x: -3, z: 5 });
  });
  test("walks to a destination requested by a scene interaction on the next frame", async () => {
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef: createContainerRef(),
        createSceneInteractionControllers: () => [],
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro();
    });
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    act(() => {
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
    });
    const frame = vi.mocked(requestAnimationFrame).mock.calls[0]?.[0];
    mocks.registry.takeSceneInteractionCharacterDestination.mockReturnValueOnce({ x: 7, z: 8 });
    act(() => {
      frame?.(performance.now());
    });
    expect(mocks.registry.takeSceneInteractionCharacterDestination).not.toHaveBeenCalled();

    mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
    act(() => {
      frame?.(performance.now());
    });
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({ x: 7, z: 8 });
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.movement.getCurrentPosition.mockReturnValue({ x: 4, z: 5 });
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(true);
    mocks.registry.getSceneInteractionPointerDestination.mockReturnValue(null);
    vi.stubGlobal("WebGLRenderingContext", function WebGLRenderingContext() {});
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  test("starts once however many times it is requested and keeps the camera locked while the character enters", async () => {
    const containerRef = createContainerRef();

    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef,
        createSceneInteractionControllers: () => [],
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.introFloorObject?.parent).toBeTruthy();

    act(() => {
      startIntro();
      startIntro();
    });

    expect(mocks.domElement.getAttribute("aria-busy")).toBe("true");
    expect(mocks.domElement.getAttribute("aria-disabled")).toBe("true");
    expect(mocks.movement.moveTo).toHaveBeenCalledTimes(1);
    expect(mocks.updateEntryExplorationCameraFocus).not.toHaveBeenCalled();

    unmount();
  });

  test("positions the hanok using the viewport at start and keeps both landmarks fixed after resizing", async () => {
    const containerRef = createContainerRef();
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef,
        createSceneInteractionControllers: () => [],
      })
    );
    await act(async () => {
      await Promise.resolve();
    });
    if (!containerRef.current) {
      throw new Error("The entry scene is missing.");
    }
    expect(
      mocks.introFloorObject?.parent?.getObjectByName(`entry-place-${ENTRY_TEST_PLACES[0].id}`)
    ).toBeUndefined();
    const viewport = vi.spyOn(containerRef.current, "getBoundingClientRect");
    viewport.mockReturnValue(new DOMRect(0, 0, 375, 812));

    act(() => {
      startIntro();
    });
    const hanok = mocks.introFloorObject?.parent?.getObjectByName(
      `entry-place-${ENTRY_TEST_PLACES[0].id}`
    );
    const tower = mocks.introFloorObject?.parent?.getObjectByName(
      `entry-place-${ENTRY_TEST_PLACES[1].id}`
    );
    if (!hanok || !tower) {
      throw new Error("The entry scene is missing.");
    }
    const placedPosition = hanok.position.clone();
    const placedTowerPosition = tower.position.clone();
    const placedLayout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 375 / 812);
    expect({ x: placedPosition.x, z: placedPosition.z }).toEqual(placedLayout.edition[0]);
    expect({ x: placedTowerPosition.x, z: placedTowerPosition.z }).toEqual(placedLayout.edition[1]);
    const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;

    viewport.mockReturnValue(new DOMRect(0, 0, 1440, 900));
    act(() => {
      window.dispatchEvent(new Event("resize"));
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
      startIntro();
    });
    expect(hanok.position.equals(placedPosition)).toBe(true);
    expect(tower.position.equals(placedTowerPosition)).toBe(true);
    viewport.mockRestore();
    unmount();
  });

  test("applies the resolved layout to the intro floor and interactions on mount and intro start but not on resize", async () => {
    const containerRef = createContainerRef();
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef,
        createSceneInteractionControllers: () => [],
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    if (!containerRef.current) throw new Error("The entry container is missing.");
    const mountLayout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 100 / 100);
    expect(mocks.registry.setSceneInteractionLayout).toHaveBeenCalledOnce();
    expect(mocks.registry.setSceneInteractionLayout).toHaveBeenLastCalledWith(mountLayout);
    expect(mocks.introFloorApplyLayout).toHaveBeenLastCalledWith(mountLayout, 100 / 100);

    const viewport = vi.spyOn(containerRef.current, "getBoundingClientRect");
    viewport.mockReturnValue(new DOMRect(0, 0, 375, 812));
    act(() => {
      startIntro();
    });
    const introLayout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, 375 / 812);
    expect(mocks.registry.setSceneInteractionLayout).toHaveBeenCalledTimes(2);
    expect(mocks.registry.setSceneInteractionLayout).toHaveBeenLastCalledWith(introLayout);
    expect(mocks.introFloorApplyLayout).toHaveBeenLastCalledWith(introLayout, 375 / 812);

    viewport.mockReturnValue(new DOMRect(0, 0, 1440, 900));
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(mocks.registry.setSceneInteractionLayout).toHaveBeenCalledTimes(2);
    expect(mocks.introFloorApplyLayout).toHaveBeenCalledTimes(2);
    viewport.mockRestore();
  });

  test("draws the guide only after intro arrival and disposes it on unmount", async () => {
    const containerRef = createContainerRef();
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef,
        createSceneInteractionControllers: () => [],
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro();
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

  test("opens each landmark independently and rearms after leaving", async () => {
    const onOpenChange = vi.fn();
    const onFirstPlaceOpenChange = vi.fn();
    const placeVisit = createEntryExplorationPlaceVisit({ radius: 1.2, onOpenChange });
    const containerRef = createContainerRef();
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
    const { unmount } = renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
        containerRef,
        createSceneInteractionControllers: () => [],
        placeVisits: {
          [ENTRY_TEST_PLACES[1].id]: placeVisit,
          [ENTRY_TEST_PLACES[0].id]: createEntryExplorationPlaceVisit({
            radius: 1.2,
            onOpenChange: onFirstPlaceOpenChange,
          }),
        },
      })
    );
    onTestFinished(unmount);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      startIntro();
    });
    const firstPlace = mocks.introFloorObject?.parent?.getObjectByName(
      `entry-place-${ENTRY_TEST_PLACES[0].id}`
    );
    const secondPlace = mocks.introFloorObject?.parent?.getObjectByName(
      `entry-place-${ENTRY_TEST_PLACES[1].id}`
    );
    if (!firstPlace || !secondPlace) throw new Error("The place landmarks are missing.");
    const firstDestination = { x: firstPlace.position.x, z: firstPlace.position.z };
    const destination = { x: secondPlace.position.x, z: secondPlace.position.z };
    const frame = vi.mocked(requestAnimationFrame).mock.calls[0]?.[0];
    mocks.movement.getCurrentPosition.mockReturnValue(destination);
    act(() => {
      frame?.(performance.now());
    });
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => {
      const arrival = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
      mocks.movementOptions?.onArrive?.({ position: arrival, target: arrival });
      mocks.movement.getCurrentPosition.mockReturnValue(firstDestination);
      frame?.(performance.now());
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onFirstPlaceOpenChange.mock.calls).toEqual([[true]]);
    expect(mocks.movement.stop).toHaveBeenCalledOnce();

    act(() => {
      mocks.movement.getCurrentPosition.mockReturnValue(destination);
      frame?.(performance.now());
      frame?.(performance.now());
    });
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    expect(onFirstPlaceOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(mocks.movement.stop).toHaveBeenCalledTimes(2);

    const intersect = vi
      .spyOn(THREE.Raycaster.prototype, "intersectObject")
      .mockImplementation((object) =>
        object === mocks.floor
          ? [
              {
                object,
                distance: 1,
                point: new THREE.Vector3(destination.x + 0.5, 0, destination.z),
              },
            ]
          : []
      );
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
    expect(mocks.movement.stop).toHaveBeenCalledTimes(3);
  });

  test("deactivates the active interaction instead of moving when the user clicks the floor outside the interaction", async () => {
    const containerRef = createContainerRef();
    const floorHitPoint = new THREE.Vector3(8, 0, 9);
    const intersectObject = vi
      .spyOn(THREE.Raycaster.prototype, "intersectObject")
      .mockReturnValue([{ point: floorHitPoint } as THREE.Intersection]);

    renderHook(() =>
      useEntryExplorationThreeScene({
        places: ENTRY_TEST_PLACES,
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
    expect(mocks.updateEntryExplorationCameraFocus).not.toHaveBeenCalled();
    expect(mocks.movement.moveTo).not.toHaveBeenCalled();

    const { cameraOffset, cameraTransitionDurationMs } = ENTRY_EXPLORATION_SCENE_CONFIG;
    const frame = vi.mocked(requestAnimationFrame).mock.calls[0]?.[0];

    act(() => {
      frame?.(performance.now() + cameraTransitionDurationMs * 2);
    });

    expect(mocks.camera?.position.x).toBeCloseTo(4 + cameraOffset.x);
    expect(mocks.camera?.position.z).toBeCloseTo(5 + cameraOffset.z);

    intersectObject.mockRestore();
  });

  test("routes overlapping clicks to slot or archery, then the edition place, then hanok, waterfront or store, then the floor", async () => {
    const scene = await renderAssetPlaceScene();
    const editionPlace = mocks.introFloorObject?.parent?.getObjectByName(
      `entry-place-${ENTRY_TEST_PLACES[0].id}`
    );
    if (!editionPlace) throw new Error("The edition place is missing.");
    const store = scene.getAsset("store");
    const waterfront = scene.getAsset("waterfront");
    const hanok = scene.getAsset("hanok");
    const floorPoint = { x: store.position.x - 6, z: store.position.z + 2 };
    const { hits } = mockSceneHits({
      editionPlace,
      assetName: "entry-scenery-store",
      floorPoint,
    });

    mocks.registry.getSceneInteractionPointerDestination.mockReturnValueOnce({ x: -3, z: 5 });
    clickScene();
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({ x: -3, z: 5 });

    clickScene();
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({
      x: editionPlace.position.x,
      z: editionPlace.position.z,
    });

    hits.editionPlace = null;
    clickScene();
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({
      x: store.position.x,
      z: store.position.z,
    });

    hits.assetName = "entry-scenery-waterfront";
    clickScene();
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({
      x: waterfront.position.x,
      z: waterfront.position.z,
    });

    hits.assetName = "entry-scenery-hanok";
    clickScene();
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith({
      x: hanok.position.x,
      z: hanok.position.z,
    });

    hits.assetName = null;
    clickScene();
    expect(mocks.movement.moveTo).toHaveBeenLastCalledWith(floorPoint);
    expect(mocks.movement.moveTo).toHaveBeenCalledTimes(6);
  });

  test.each(["waterfront", "store"] as const)(
    "stops and opens the %s panel within four units even while walking past it",
    async (placeId) => {
      const scene = await renderAssetPlaceScene();
      const asset = scene.getAsset(placeId).position;
      const beyondAsset = { x: asset.x - 10, z: asset.z };
      mockSceneHits({ floorPoint: beyondAsset });
      clickScene();
      expect(mocks.movement.moveTo).toHaveBeenLastCalledWith(beyondAsset);

      scene.renderFrameAt({ x: asset.x + ENTRY_ASSET_PLACE_ARRIVAL_RADIUS + 0.5, z: asset.z });
      expect(scene.panel.current.open).toBe(false);
      expect(mocks.movement.stop).not.toHaveBeenCalled();

      scene.renderFrameAt({ x: asset.x + ENTRY_ASSET_PLACE_ARRIVAL_RADIUS - 0.5, z: asset.z });
      expect(scene.panel.current).toMatchObject({ placeId, open: true });
      expect(mocks.movement.stop).toHaveBeenCalledOnce();
    }
  );

  test("a scene click only closes the asset panel, which reopens after leaving four units and returning", async () => {
    const scene = await renderAssetPlaceScene();
    const store = scene.getAsset("store").position;
    const inside = { x: store.x + 3, z: store.z };
    scene.renderFrameAt(inside);
    expect(scene.panel.current).toMatchObject({ placeId: "store", open: true });

    const { intersectObjects } = mockSceneHits({
      assetName: "entry-scenery-store",
      floorPoint: { x: store.x - 6, z: store.z },
    });
    clickScene();
    expect(scene.panel.current.open).toBe(false);
    expect(mocks.movement.moveTo).not.toHaveBeenCalled();
    expect(intersectObjects).not.toHaveBeenCalled();

    scene.renderFrameAt(inside);
    scene.renderFrameAt({ x: store.x + 1, z: store.z });
    expect(scene.panel.current.open).toBe(false);

    scene.renderFrameAt({ x: store.x + ENTRY_ASSET_PLACE_ARRIVAL_RADIUS + 0.5, z: store.z });
    expect(scene.panel.current.open).toBe(false);
    scene.renderFrameAt(inside);
    expect(scene.panel.current).toMatchObject({ placeId: "store", open: true });
  });

  test("does not open asset panels while a dart or slot interaction is active", async () => {
    const scene = await renderAssetPlaceScene();
    const waterfront = scene.getAsset("waterfront").position;
    const outside = { x: waterfront.x + ENTRY_ASSET_PLACE_ARRIVAL_RADIUS + 0.5, z: waterfront.z };
    mocks.registry.hasActiveSceneInteraction.mockReturnValue(true);
    scene.renderFrameAt(outside);
    scene.renderFrameAt({ x: waterfront.x + 1, z: waterfront.z });
    scene.renderFrameAt(outside);
    expect(scene.panel.current.open).toBe(false);
    expect(mocks.movement.stop).not.toHaveBeenCalled();

    mocks.registry.hasActiveSceneInteraction.mockReturnValue(false);
    scene.renderFrameAt(outside);
    expect(scene.panel.current.open).toBe(false);
    scene.renderFrameAt({ x: waterfront.x + 1, z: waterfront.z });
    expect(scene.panel.current).toMatchObject({ placeId: "waterfront", open: true });
  });
});
