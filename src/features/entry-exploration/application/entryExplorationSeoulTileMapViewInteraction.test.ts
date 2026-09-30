import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_ARCHERY_RANGE } from "../config/entryExplorationArcheryRange";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { toSeoulGridCell, toSeoulGridCellKm, type SeoulGridCell } from "../domain/seoulGridNumber";
import { isSeoulGridCellOnNumberLine } from "../domain/seoulGridNumberLines";
import { getSeoulGridValidCells } from "../domain/seoulGridRandomCell";
import {
  createEntryExplorationSeoulTileMapViewInteractionController,
  type EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";

const MAP_POSITION = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
  (object) => object.id === ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
)!.position;
const TRIGGER_POSITION = ENTRY_EXPLORATION_ARCHERY_RANGE.position;
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
