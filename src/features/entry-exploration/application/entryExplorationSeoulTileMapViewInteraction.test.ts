import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import { ENTRY_EXPLORATION_ARCHERY_RANGE } from "../config/entryExplorationArcheryRange";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import {
  createEntryExplorationSeoulTileMapViewInteractionController,
  type EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";

const MAP_POSITION = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
  (object) => object.id === ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
)!.position;
const TRIGGER_POSITION = ENTRY_EXPLORATION_ARCHERY_RANGE.position;

describe("entry exploration seoul tile map view interaction", () => {
  test("activates on arrival and waits for a trigger exit before reactivating", () => {
    const controller = createEntryExplorationSeoulTileMapViewInteractionController();

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
    });
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1_000);
    const raycaster = new THREE.Raycaster();
    const { cameraTransitionDurationMs } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs / 2, TRIGGER_POSITION);
    controller.handlePointerMove(raycaster);
    aimRaycasterAtTileMap(raycaster, controller.object);

    expect(controller.handlePointerDown(raycaster, 0)).toBe(true);
    expect(onDartThrowResult).not.toHaveBeenCalled();
    expect(onTargetHoverChange).not.toHaveBeenCalledWith(true);

    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);
    controller.handlePointerDown(raycaster, 0);

    expect(onDartThrowResult).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  test("ignores pointers that miss the tile map", () => {
    const onDartThrowResult = vi.fn();
    const controller = createEntryExplorationSeoulTileMapViewInteractionController({
      onDartThrowResult,
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
    const controller = createEntryExplorationSeoulTileMapViewInteractionController();
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
    const controller = createEntryExplorationSeoulTileMapViewInteractionController();
    const camera = new THREE.OrthographicCamera(-4.39, 4.39, 9.5, -9.5, 0.1, 1_000);
    const { cameraTransitionDurationMs, cameraZoom } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    controller.updateTriggerState(TRIGGER_POSITION);
    controller.activate(0);
    controller.updateCamera(camera, cameraTransitionDurationMs, TRIGGER_POSITION);

    expect(camera.zoom).toBeLessThan(cameraZoom);

    controller.dispose();
  });
});

function aimRaycasterAtTileMap(raycaster: THREE.Raycaster, mapObject: THREE.Object3D): void {
  mapObject.updateMatrixWorld(true);

  const mapCenter = new THREE.Vector3();
  mapObject.getWorldPosition(mapCenter);

  raycaster.set(
    new THREE.Vector3(mapCenter.x, mapCenter.y + 10, mapCenter.z),
    new THREE.Vector3(0, -1, 0)
  );
}
