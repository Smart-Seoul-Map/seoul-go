import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { resolveEntryIntroLayoutView } from "../domain/entryIntroLayout";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { toSeoulGridCell, toSeoulGridCellKm, type SeoulGridCell } from "../domain/seoulGridNumber";
import { isSeoulGridCellOnNumberLine } from "../domain/seoulGridNumberLines";
import { getSeoulGridValidCells } from "../domain/seoulGridRandomCell";
import {
  createEntryExplorationSeoulTileMapViewInteractionController,
  type EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";

const PC_LAYOUT = resolveEntryIntroLayoutView(ENTRY_INTRO_LAYOUTS, "pc");
const MAP_POSITION = PC_LAYOUT.objects[ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID];
const TRIGGER_POSITION = PC_LAYOUT.objects["archery-range"];
const MAP_SIZE = (
  ENTRY_EXPLORATION_SCENE_OBJECTS.find(
    (object) => object.id === ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
  ) as { size: { depth: number; width: number } }
).size;
const CENTER_CELL = toSeoulGridCell({ u: 0, v: 0 }, MAP_SIZE);
const CENTER_NUMBER = toSeoulGridCellKm(CENTER_CELL).eastKm % 100;

describe("entry exploration seoul tile map view interaction", () => {
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
    const movedMapPosition = { ...MAP_POSITION, x: MAP_POSITION.x - 25, z: MAP_POSITION.z + 30 };
    const movedTriggerPosition = {
      ...TRIGGER_POSITION,
      x: TRIGGER_POSITION.x - 25,
      z: TRIGGER_POSITION.z + 30,
    };

    controller.setLayout?.({
      ...PC_LAYOUT,
      objects: {
        ...PC_LAYOUT.objects,
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
});

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
