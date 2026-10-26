import * as THREE from "three";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import {
  ENTRY_EXPLORATION_ROULETTE_TILE_MAP_OBJECT_ID,
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { toSeoulGridCell, toSeoulGridCellKm, type SeoulGridCell } from "../domain/seoulGridNumber";
import { isSeoulGridCellOnNumberLine } from "../domain/seoulGridNumberLines";
import { getSeoulGridValidCells } from "../domain/seoulGridRandomCell";
import {
  createEntryExplorationSeoulTileMapViewInteractionController,
  type EntryExplorationDartViewControls,
  type EntryExplorationSeoulTileMapViewInteractionOptions,
} from "./entryExplorationSeoulTileMapViewInteraction";

const MAP_POSITION = ENTRY_INTRO_LAYOUTS.pc.objects[ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID];
const TRIGGER_POSITION = ENTRY_INTRO_LAYOUTS.pc.objects["archery-range"];
const MAP_SIZE = (
  ENTRY_EXPLORATION_SCENE_OBJECTS.find(
    (object) => object.id === ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
  ) as { size: { depth: number; width: number } }
).size;
const CENTER_CELL = toSeoulGridCell({ u: 0, v: 0 }, MAP_SIZE);
const CENTER_NUMBER = toSeoulGridCellKm(CENTER_CELL).eastKm % 100;
const { steps: ROULETTE_STEPS } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG;

describe("entry exploration seoul tile map view interaction", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("rejects empty rewards without moving the camera and notifies once per arrival", () => {
    const onEntryBlocked = vi.fn();
    const onActiveChange = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [],
      onEntryBlocked,
      onActiveChange,
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
    const originalPosition = camera.position.clone();

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.updateTriggerState(TRIGGER_POSITION);
    expect(controller.canActivate()).toBe(false);
    controller.updateCamera(camera, 1000, TRIGGER_POSITION);
    expect(controller.isActive()).toBe(false);
    expect(camera.position.equals(originalPosition)).toBe(true);
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(onEntryBlocked).toHaveBeenCalledTimes(1);

    controller.updateTriggerState({ x: 100, z: 100 });
    controller.updateTriggerState(TRIGGER_POSITION);
    expect(onEntryBlocked).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  test("reads newly collected numbers on reentry without replacing the controller", () => {
    let numbers: readonly number[] = [];
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => numbers,
    });
    controller.updateTriggerState(TRIGGER_POSITION);
    expect(controller.canActivate()).toBe(false);
    controller.updateTriggerState({ x: 100, z: 100 });
    numbers = [40];
    controller.updateTriggerState(TRIGGER_POSITION);
    expect(controller.canActivate()).toBe(true);
    controller.activate(0);
    expect(controller.isActive()).toBe(true);
    controller.dispose();
  });

  test("activates on arrival and waits for a trigger exit before reactivating", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [40],
    });

    expect(controller.canActivate()).toBe(false);

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);

    expect(controller.isActive()).toBe(true);

    controller.deactivate();
    controller.updateTriggerState(TRIGGER_POSITION);

    expect(controller.canActivate()).toBe(false);

    controller.updateTriggerState({ x: 100, z: 100 });
    controller.updateTriggerState(TRIGGER_POSITION);

    expect(controller.canActivate()).toBe(true);

    controller.dispose();
  });

  test("asks the character to walk to the dart trigger and opens only after arrival", () => {
    let viewControls: EntryExplorationDartViewControls | null = null;
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onControlsReady: (controls) => {
        viewControls = controls;
      },
      getCollectedNumbers: () => [40],
    });

    controller.updateTriggerState({ x: 100, z: 100 });
    viewControls!.requestApproach();

    expect(controller.canActivate()).toBe(false);
    expect(controller.takeRequestedCharacterDestination?.()).toEqual(TRIGGER_POSITION);
    expect(controller.takeRequestedCharacterDestination?.()).toBeNull();

    controller.updateTriggerState(TRIGGER_POSITION);
    expect(controller.canActivate()).toBe(true);

    controller.dispose();
  });

  test("ignores a walk request without collected numbers or while the dart view is open", () => {
    let viewControls: EntryExplorationDartViewControls | null = null;
    let numbers: readonly number[] = [];
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onControlsReady: (controls) => {
        viewControls = controls;
      },
      getCollectedNumbers: () => numbers,
    });

    viewControls!.requestApproach();
    expect(controller.takeRequestedCharacterDestination?.()).toBeNull();

    numbers = [CENTER_NUMBER];
    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    viewControls!.requestApproach();
    expect(controller.takeRequestedCharacterDestination?.()).toBeNull();

    controller.dispose();
  });

  test("blocks pointers until the camera transition finishes", () => {
    const onDartThrowResult = vi.fn();
    const onTargetHoverChange = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onDartThrowResult,
      onTargetHoverChange,
      getCollectedNumbers: () => [CENTER_NUMBER],
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const raycaster = new THREE.Raycaster();
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs / 2, TRIGGER_POSITION);
    controller.handlePointerMove(raycaster);
    aimRaycasterAtCell(raycaster, controller.object, CENTER_CELL);

    expect(controller.handlePointerDown(raycaster, 0)).toBe(true);
    expect(onDartThrowResult).not.toHaveBeenCalled();
    expect(onTargetHoverChange).not.toHaveBeenCalledWith(true);

    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    controller.handlePointerDown(raycaster, 0);

    expect(onDartThrowResult).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  test("ignores cells outside the number lines", () => {
    const onDartThrowResult = vi.fn();
    const onTargetHoverChange = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onDartThrowResult,
      onTargetHoverChange,
      getCollectedNumbers: () => [CENTER_NUMBER],
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const raycaster = new THREE.Raycaster();
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const offLineCell = findOffLineValidCell();

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    aimRaycasterAtCell(raycaster, controller.object, offLineCell);
    controller.handlePointerMove(raycaster);

    expect(controller.handlePointerDown(raycaster, 0)).toBe(true);
    expect(onDartThrowResult).not.toHaveBeenCalled();
    expect(onTargetHoverChange).not.toHaveBeenCalledWith(true);

    controller.dispose();
  });

  test("shows the selectable layer only while active", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [CENTER_NUMBER],
    });
    const layer = controller.object.getObjectByName("entry-dart-selectable-layer")!;

    expect(layer.visible).toBe(false);

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);

    expect(layer.visible).toBe(true);

    controller.deactivate();

    expect(layer.visible).toBe(false);

    controller.dispose();
  });

  test("ignores pointers that miss the tile map", () => {
    const onDartThrowResult = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onDartThrowResult,
      getCollectedNumbers: () => [40],
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const raycaster = new THREE.Raycaster();
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    raycaster.set(new THREE.Vector3(999, 10, 999), new THREE.Vector3(0, -1, 0));

    expect(controller.handlePointerDown(raycaster, 0)).toBe(true);
    expect(onDartThrowResult).not.toHaveBeenCalled();

    controller.dispose();
  });

  test("throws at a random cell when the arrow is clicked", () => {
    const onDartThrowResult = vi.fn();
    let viewControls: EntryExplorationDartViewControls | null = null;
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onControlsReady: (controls) => {
        viewControls = controls;
      },
      onDartThrowResult,
      getCollectedNumbers: () => [40],
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    viewControls!.throwAtRandomCell();

    expect(onDartThrowResult).not.toHaveBeenCalled();

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    viewControls!.throwAtRandomCell();
    viewControls!.throwAtRandomCell();

    expect(onDartThrowResult).toHaveBeenCalledTimes(1);
    expect(controller.handlePointerDown(new THREE.Raycaster(), 0)).toBe(true);

    controller.dispose();
  });

  test("moves the camera to the intro entry view", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [40],
    });
    const camera = new THREE.OrthographicCamera(-20, 20, 10, -10, 0.1, 1_000);
    const { cameraFocusOffset, cameraOffset, cameraTransitionDurationMs, cameraZoom } =
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);

    expect(camera.position.x).toBeCloseTo(MAP_POSITION.x + cameraFocusOffset.x + cameraOffset.x);
    expect(camera.position.z).toBeCloseTo(MAP_POSITION.z + cameraFocusOffset.z + cameraOffset.z);
    expect(camera.zoom).toBeCloseTo(cameraZoom);

    controller.dispose();
  });

  test("zooms the camera out until the tile map fits a narrow viewport", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [40],
    });
    const camera = new THREE.OrthographicCamera(-4.39, 4.39, 9.5, -9.5, 0.1, 1_000);
    const { cameraTransitionDurationMs, cameraZoom } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);

    expect(camera.zoom).toBeLessThan(cameraZoom);

    controller.dispose();
  });

  test("moves its trigger, tile map mesh, character destination, and camera focus with the layout", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [40],
    });
    const camera = new THREE.OrthographicCamera(-20, 20, 10, -10, 0.1, 1_000);
    const {
      cameraFocusOffset,
      cameraOffset,
      cameraTransitionDurationMs,
      characterDestinationOffset,
    } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const movedMapPosition = { x: MAP_POSITION.x - 25, z: MAP_POSITION.z + 30 };
    const movedTriggerPosition = { x: TRIGGER_POSITION.x - 25, z: TRIGGER_POSITION.z + 30 };

    controller.setLayout?.({
      ...ENTRY_INTRO_LAYOUTS.pc,
      objects: {
        ...ENTRY_INTRO_LAYOUTS.pc.objects,
        [ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID]: movedMapPosition,
        "archery-range": movedTriggerPosition,
      },
    });

    expect(controller.object.position.x).toBe(movedMapPosition.x);
    expect(controller.object.position.z).toBe(movedMapPosition.z);
    expect(controller.getActivationCharacterDestination?.()).toEqual({
      x: movedMapPosition.x + characterDestinationOffset.x,
      z: movedMapPosition.z + characterDestinationOffset.z,
    });

    controller.updateTriggerState(TRIGGER_POSITION);

    expect(controller.canActivate()).toBe(false);

    controller.updateTriggerState(movedTriggerPosition);

    expect(controller.canActivate()).toBe(true);

    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, movedTriggerPosition);

    expect(camera.position.x).toBeCloseTo(
      movedMapPosition.x + cameraFocusOffset.x + cameraOffset.x
    );
    expect(camera.position.z).toBeCloseTo(
      movedMapPosition.z + cameraFocusOffset.z + cameraOffset.z
    );

    controller.dispose();
  });

  test("roulette mode lives on its own tile map below the arrow map", () => {
    const { objects } = ENTRY_INTRO_LAYOUTS.pc;
    const arrowMap = objects[ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID];
    const rouletteMap = objects[ENTRY_EXPLORATION_ROULETTE_TILE_MAP_OBJECT_ID];
    const rouletteTrigger = {
      x: rouletteMap.x + TRIGGER_POSITION.x - arrowMap.x,
      z: rouletteMap.z + TRIGGER_POSITION.z - arrowMap.z,
    };
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [CENTER_NUMBER],
      mode: "roulette",
    });

    expect(controller.object.position.x).toBeCloseTo(rouletteMap.x);
    expect(controller.object.position.z).toBeCloseTo(rouletteMap.z);

    controller.updateTriggerState(TRIGGER_POSITION);
    expect(controller.canActivate()).toBe(false);
    controller.updateTriggerState(rouletteTrigger);
    expect(controller.canActivate()).toBe(true);

    controller.dispose();
  });

  test("roulette mode fills the usable screen height with its tile map", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [CENTER_NUMBER],
      mode: "roulette",
    });
    const camera = new THREE.OrthographicCamera(-20, 20, 10, -10, 0.1, 1_000);
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const { heightUsageRatio } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.camera;

    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    controller.object.updateMatrixWorld(true);
    camera.updateMatrixWorld();

    const top = controller.object
      .localToWorld(new THREE.Vector3(0, MAP_SIZE.depth / 2, 0))
      .project(camera);
    const bottom = controller.object
      .localToWorld(new THREE.Vector3(0, -MAP_SIZE.depth / 2, 0))
      .project(camera);

    expect(top.y - bottom.y).toBeCloseTo(heightUsageRatio * 2, 2);

    controller.dispose();
  });

  test("roulette mode walks to its own trigger and ignores cell clicks", () => {
    let viewControls: EntryExplorationDartViewControls | null = null;
    const onDartThrowResult = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [CENTER_NUMBER],
      mode: "roulette",
      onControlsReady: (controls) => {
        viewControls = controls;
      },
      onDartThrowResult,
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const raycaster = new THREE.Raycaster();
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    viewControls!.requestApproach();
    const destination = controller.takeRequestedCharacterDestination?.();

    expect(destination).not.toBeNull();
    expect(destination).not.toEqual(TRIGGER_POSITION);

    controller.updateTriggerState(destination!);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, destination!);
    aimRaycasterAtCell(raycaster, controller.object, CENTER_CELL);

    expect(controller.handlePointerDown(raycaster, 0)).toBe(true);
    expect(onDartThrowResult).not.toHaveBeenCalled();

    controller.dispose();
  });

  test("roulette mode refuses to start until the camera settles and then announces it", () => {
    let viewControls: EntryExplorationDartViewControls | null = null;
    const onCameraSettled = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [CENTER_NUMBER],
      mode: "roulette",
      onCameraSettled,
      onControlsReady: (controls) => {
        viewControls = controls;
      },
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs / 2, TRIGGER_POSITION);

    expect(viewControls!.startRoulette()).toBe(false);
    expect(onCameraSettled).not.toHaveBeenCalled();

    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);

    expect(onCameraSettled).toHaveBeenCalledTimes(1);
    expect(viewControls!.startRoulette()).toBe(true);

    controller.dispose();
  });

  test("roulette mode follows the camera move with its board layout from the first frame", () => {
    const onRouletteLayoutChange = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      getCollectedNumbers: () => [CENTER_NUMBER],
      mode: "roulette",
      onRouletteLayoutChange,
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const selectableLayer = controller.object.getObjectByName("entry-dart-selectable-layer")!;

    controller.activate(0);
    controller.updateCamera(camera, 0, TRIGGER_POSITION);

    expect(onRouletteLayoutChange).toHaveBeenCalledTimes(1);

    controller.updateCamera(camera, cameraTransitionDurationMs / 2, TRIGGER_POSITION);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    controller.updateCamera(camera, cameraTransitionDurationMs + 16, TRIGGER_POSITION);

    expect(onRouletteLayoutChange).toHaveBeenCalledTimes(3);

    const [firstLayout] = onRouletteLayoutChange.mock.calls[0];
    const [{ mapRect, restMapRect, selectableCells }] = onRouletteLayoutChange.mock.calls[2];

    expect(firstLayout.restMapRect).toBe(restMapRect);
    expect(mapRect.x).toBeCloseTo(restMapRect.x);
    expect(mapRect.width).toBeCloseTo(restMapRect.width);
    expect(restMapRect.height / restMapRect.width).toBeCloseTo(MAP_SIZE.depth / MAP_SIZE.width, 1);
    expect(selectableCells.length).toBeGreaterThan(0);
    expect(
      selectableCells.every((cell: SeoulGridCell) =>
        isSeoulGridCellOnNumberLine(cell, [CENTER_NUMBER])
      )
    ).toBe(true);
    expect(selectableLayer.visible).toBe(false);

    controller.dispose();
  });

  test("roulette mode reports each highlight with its step", () => {
    vi.useFakeTimers();

    const onRouletteHighlight = vi.fn();
    const { startRoulette } = createReadyRouletteController({ onRouletteHighlight });

    expect(startRoulette()).toBe(true);
    expect(onRouletteHighlight).toHaveBeenCalledTimes(1);
    expect(onRouletteHighlight.mock.calls[0][0].step).toBe(0);
  });

  test("roulette mode announces the winner and throws only after the win hold", () => {
    vi.useFakeTimers();

    const onDartThrowResult = vi.fn();
    const onRouletteWin = vi.fn();
    const { startRoulette } = createReadyRouletteController({ onDartThrowResult, onRouletteWin });

    startRoulette();

    for (let step = 0; step < ROULETTE_STEPS.count; step += 1) {
      vi.advanceTimersToNextTimer();
    }

    expect(onRouletteWin).toHaveBeenCalledTimes(1);
    expect(onDartThrowResult).not.toHaveBeenCalled();
    expect(startRoulette()).toBe(true);

    vi.advanceTimersByTime(ROULETTE_STEPS.winHoldMs);

    expect(onDartThrowResult).toHaveBeenCalledTimes(1);
    expect(onDartThrowResult.mock.calls[0][0].gridNumber).toBe(
      onRouletteWin.mock.calls[0][0].gridNumber
    );
  });

  test("roulette mode drops the draw when the view closes", () => {
    vi.useFakeTimers();

    const onDartThrowResult = vi.fn();
    const { controller, startRoulette } = createReadyRouletteController({ onDartThrowResult });

    startRoulette();
    controller.deactivate();
    vi.runAllTimers();

    expect(onDartThrowResult).not.toHaveBeenCalled();
  });

  test("roulette mode cancels the draw timers when the scene is disposed", () => {
    vi.useFakeTimers();

    const onDartThrowResult = vi.fn();
    const { controller, startRoulette } = createReadyRouletteController({ onDartThrowResult });

    startRoulette();
    controller.dispose();

    expect(vi.getTimerCount()).toBe(0);
    expect(onDartThrowResult).not.toHaveBeenCalled();
  });
});

function createReadyRouletteController(
  options: Pick<
    EntryExplorationSeoulTileMapViewInteractionOptions,
    "onDartThrowResult" | "onRouletteHighlight" | "onRouletteLayoutChange" | "onRouletteWin"
  >
) {
  let viewControls: EntryExplorationDartViewControls | null = null;
  const controller = createEntryExplorationSeoulTileMapViewInteractionController({
    ...options,
    getCollectedNumbers: () => [CENTER_NUMBER],
    mode: "roulette",
    onControlsReady: (controls) => {
      viewControls = controls;
    },
  });
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
  const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

  controller.activate(0);
  controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);

  return {
    camera,
    controller,
    startRoulette: () => viewControls!.startRoulette(),
  };
}

function findOffLineValidCell(): SeoulGridCell {
  const cell = getSeoulGridValidCells().find(
    (validCell) => !isSeoulGridCellOnNumberLine(validCell, [CENTER_NUMBER])
  );

  return cell!;
}

function aimRaycasterAtCell(
  raycaster: THREE.Raycaster,
  mapObject: THREE.Object3D,
  cell: SeoulGridCell
): void {
  const { columns, rows } = SEOUL_GRID_MAP_CONFIG;
  const local = new THREE.Vector3(
    -MAP_SIZE.width / 2 + ((cell.column + 0.5) * MAP_SIZE.width) / columns,
    MAP_SIZE.depth / 2 - ((cell.row + 0.5) * MAP_SIZE.depth) / rows,
    0
  );

  mapObject.updateMatrixWorld(true);

  const world = mapObject.localToWorld(local);

  raycaster.set(new THREE.Vector3(world.x, world.y + 10, world.z), new THREE.Vector3(0, -1, 0));
}
