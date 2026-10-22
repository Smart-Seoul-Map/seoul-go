import * as THREE from "three";

import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import {
  ENTRY_EXPLORATION_ROULETTE_TILE_MAP_OBJECT_ID,
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { ENTRY_INTRO_LAYOUTS, type EntryIntroLayout } from "../config/entryIntroLayout";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";
import {
  getEntryExplorationRectanglePoints,
  getEntryExplorationTileMapCameraFocus,
  getEntryExplorationTileMapCameraZoom,
} from "../domain/entryExplorationTileMapCameraFit";
import {
  getSeoulGridCellDistrictId,
  toSeoulGridCell,
  toSeoulGridNumber,
  type SeoulGridCell,
} from "../domain/seoulGridNumber";
import {
  getSeoulGridSelectableCells,
  isSeoulGridCellSelectable,
} from "../domain/seoulGridNumberLines";
import { pickRandomSeoulGridCell } from "../domain/seoulGridRandomCell";
import { createEntryExplorationDartHitMarker } from "./entryExplorationDartHitMarker";
import { createEntryExplorationDartRoulette } from "./entryExplorationDartRoulette";
import { createEntryExplorationDartSelectableLayer } from "./entryExplorationDartSelectableLayer";
import {
  createEntryExplorationSceneObject,
  disposeEntryExplorationObject3D,
  updateEntryExplorationCameraView,
} from "./entryExplorationThreeScene";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntryExplorationDartViewportPoint = {
  x: number;
  y: number;
};

export type EntryExplorationDartThrowResult = {
  cell: SeoulGridCell;
  districtId: number | null;
  gridNumber: string;
  viewportPoint: EntryExplorationDartViewportPoint;
};

export type EntryExplorationDartViewControls = {
  requestApproach: () => void;
  resetThrow: () => void;
  setHitCell: (cell: SeoulGridCell | null) => void;
  startRoulette: () => boolean;
  throwAtRandomCell: () => void;
};

export type EntryExplorationTileMapMode = "arrow" | "roulette";

export type EntryExplorationSeoulTileMapViewInteractionOptions = {
  getCollectedNumbers?: () => readonly number[];
  mode?: EntryExplorationTileMapMode;
  onEntryBlocked?: () => void;
  onActiveChange?: (isActive: boolean) => void;
  onCameraSettled?: () => void;
  onControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onTargetHoverChange?: (isOverValidCell: boolean) => void;
};

export type EntryExplorationSeoulTileMapViewInteractionController =
  EntryExplorationSceneInteractionController & {
    deactivate: () => void;
    isActive: () => boolean;
  };

type EntryExplorationTileMapCameraView = {
  focus: EntryExplorationScenePoint;
  zoom: number;
};

const SEOUL_TILE_MAP_VIEW_PRIORITY = 30;

export function createEntryExplorationSeoulTileMapViewInteractionController({
  getCollectedNumbers = () => [],
  mode = "arrow",
  onEntryBlocked,
  onActiveChange,
  onCameraSettled,
  onControlsReady,
  onDartThrowResult,
  onTargetHoverChange,
}: EntryExplorationSeoulTileMapViewInteractionOptions = {}): EntryExplorationSeoulTileMapViewInteractionController {
  const isRouletteMode = mode === "roulette";
  const seoulTileMapObject = getSeoulTileMapObject(
    isRouletteMode
      ? ENTRY_EXPLORATION_ROULETTE_TILE_MAP_OBJECT_ID
      : ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
  );
  const mapSize = {
    depth: seoulTileMapObject.size.depth,
    width: seoulTileMapObject.size.width,
  };
  const mapMesh = createEntryExplorationSceneObject(seoulTileMapObject);
  const hitMarker = createEntryExplorationDartHitMarker();
  const selectableLayer = createEntryExplorationDartSelectableLayer({
    mapSize,
    mapTexture: getMapTexture(mapMesh),
  });
  let activeCamera: THREE.OrthographicCamera | null = null;
  let cameraTransition: SceneCameraTransition | null = null;
  let cameraTransitionStartedAt: number | null = null;
  let characterModel: THREE.Object3D | null = null;
  let activeNumbers: readonly number[] = [];
  let selectableCells: readonly SeoulGridCell[] = [];
  let isEngaged = false;
  let isCharacterInTrigger = false;
  let hasThrown = false;
  let isOverValidCell = false;
  let waitsForTriggerExit = false;
  let requestedCharacterDestination: EntryExplorationScenePoint | null = null;
  let mapPosition: EntryExplorationScenePoint;
  let triggerPosition: EntryExplorationScenePoint;

  const getTriggerPosition = (layout: EntryIntroLayout): EntryExplorationScenePoint => {
    const archeryRange = layout.objects["archery-range"];

    if (!isRouletteMode) {
      return archeryRange;
    }

    const arrowMap = layout.objects[ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID];

    return {
      x: mapPosition.x + archeryRange.x - arrowMap.x,
      z: mapPosition.z + archeryRange.z - arrowMap.z,
    };
  };

  const setLayout = (layout: EntryIntroLayout): void => {
    mapPosition = layout.objects[seoulTileMapObject.id];
    triggerPosition = getTriggerPosition(layout);
    mapMesh.position.setX(mapPosition.x).setZ(mapPosition.z);
  };

  setLayout(ENTRY_INTRO_LAYOUTS.pc);
  mapMesh.add(selectableLayer.object, hitMarker.object);

  const toCellLocalPosition = (cell: SeoulGridCell, zOffset: number): THREE.Vector3 => {
    const { columns, rows } = SEOUL_GRID_MAP_CONFIG;
    const cellWidth = mapSize.width / columns;
    const cellDepth = mapSize.depth / rows;

    return new THREE.Vector3(
      -mapSize.width / 2 + (cell.column + 0.5) * cellWidth,
      mapSize.depth / 2 - (cell.row + 0.5) * cellDepth,
      zOffset
    );
  };

  const toViewportPoint = (
    cell: SeoulGridCell,
    camera: THREE.Camera
  ): EntryExplorationDartViewportPoint => {
    const projected = mapMesh.localToWorld(toCellLocalPosition(cell, 0)).project(camera);

    return { x: (projected.x + 1) / 2, y: (1 - projected.y) / 2 };
  };

  const resolvePointedCell = (raycaster: THREE.Raycaster): SeoulGridCell | null => {
    const hit = raycaster.intersectObject(mapMesh, false)[0];

    if (!hit) {
      return null;
    }

    const local = mapMesh.worldToLocal(hit.point.clone());
    const cell = toSeoulGridCell({ u: local.x, v: local.y }, mapSize);

    return isSeoulGridCellSelectable(cell, activeNumbers) ? cell : null;
  };

  const setTargetHover = (nextIsOverValidCell: boolean): void => {
    if (isOverValidCell === nextIsOverValidCell) {
      return;
    }

    isOverValidCell = nextIsOverValidCell;
    onTargetHoverChange?.(isOverValidCell);
  };

  const toThrowResult = (
    cell: SeoulGridCell,
    camera: THREE.Camera
  ): EntryExplorationDartThrowResult => ({
    cell,
    districtId: getSeoulGridCellDistrictId(cell),
    gridNumber: toSeoulGridNumber(cell),
    viewportPoint: toViewportPoint(cell, camera),
  });

  const throwAtCell = (cell: SeoulGridCell, camera: THREE.Camera): void => {
    hasThrown = true;
    onDartThrowResult?.(toThrowResult(cell, camera));
  };

  const roulette = createEntryExplorationDartRoulette({
    getCells: () => selectableCells,
    onHighlight: (cell) => selectableLayer.setFlashCell(cell),
    onPicked: (cell) => {
      if (isEngaged && !hasThrown && activeCamera) {
        throwAtCell(cell, activeCamera);
      }
    },
  });

  const throwAtRandomCell = (): void => {
    if (!isEngaged || hasThrown || cameraTransitionStartedAt !== null || !activeCamera) {
      return;
    }

    const cell = pickRandomSeoulGridCell(Math.random, selectableCells);

    if (!cell) {
      return;
    }

    throwAtCell(cell, activeCamera);
  };

  const setHitCell = (cell: SeoulGridCell | null): void => {
    const { columns, rows } = SEOUL_GRID_MAP_CONFIG;

    hitMarker.setCell(cell, {
      cellDepth: mapSize.depth / rows,
      cellWidth: mapSize.width / columns,
      getCellLocalPosition: toCellLocalPosition,
    });
  };

  const resetThrow = (): void => {
    selectableLayer.setFlashCell(null);
    hasThrown = false;
    setHitCell(null);
  };

  const requestApproach = (): void => {
    if (isEngaged) {
      return;
    }

    if (getCollectedNumbers().length === 0) {
      onEntryBlocked?.();

      return;
    }

    requestedCharacterDestination = triggerPosition;
  };

  const startRoulette = (): boolean => {
    if (!isRouletteMode || !isEngaged || hasThrown || cameraTransitionStartedAt !== null) {
      return false;
    }

    roulette.start();

    return true;
  };

  onControlsReady?.({
    requestApproach,
    resetThrow,
    setHitCell,
    startRoulette,
    throwAtRandomCell,
  });

  const activate = (time: number): void => {
    if (isEngaged || getCollectedNumbers().length === 0) {
      return;
    }

    isEngaged = true;
    activeNumbers = [...getCollectedNumbers()];
    selectableCells = getSeoulGridSelectableCells(activeNumbers);
    selectableLayer.setNumbers(activeNumbers);
    selectableLayer.object.visible = true;
    waitsForTriggerExit = false;
    hasThrown = false;
    setHitCell(null);
    cameraTransition = null;
    cameraTransitionStartedAt = time;
    onActiveChange?.(true);
  };

  const deactivate = (): void => {
    roulette.cancel();
    isEngaged = false;
    selectableLayer.object.visible = false;
    waitsForTriggerExit = true;
    hasThrown = false;
    setHitCell(null);
    cameraTransition = null;
    cameraTransitionStartedAt = null;
    setTargetHover(false);
    selectableLayer.setHoveredCell(null);
    selectableLayer.setFlashCell(null);
    onActiveChange?.(false);
  };

  const getCharacterDestination = (): EntryExplorationScenePoint => {
    const { characterDestinationOffset } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    return {
      x: mapPosition.x + characterDestinationOffset.x,
      z: mapPosition.z + characterDestinationOffset.z,
    };
  };

  const getCameraFocus = (): EntryExplorationScenePoint => {
    const { cameraFocusOffset } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    return {
      x: mapPosition.x + cameraFocusOffset.x,
      z: mapPosition.z + cameraFocusOffset.z,
    };
  };

  const getCameraView = (camera: THREE.OrthographicCamera): EntryExplorationTileMapCameraView => {
    const {
      cameraNarrowViewportContentCenterRatio,
      cameraOffset,
      cameraViewWidthUsageRatio,
      cameraZoom,
    } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const focus = getCameraFocus();
    const mapPoints = getEntryExplorationRectanglePoints(mapPosition, mapSize);
    const zoom = getEntryExplorationTileMapCameraZoom({
      cameraOffset,
      focusPoint: focus,
      maxZoom: cameraZoom,
      points: [...mapPoints, getCharacterDestination()],
      viewHalfWidth: (camera.right - camera.left) / 2,
      widthUsageRatio: cameraViewWidthUsageRatio,
    });

    if (zoom >= cameraZoom) {
      return { focus, zoom };
    }

    return {
      focus: getEntryExplorationTileMapCameraFocus({
        cameraOffset,
        contentCenterScreenRatio: cameraNarrowViewportContentCenterRatio,
        focusPoint: focus,
        points: mapPoints,
        viewHalfHeight: (camera.top - camera.bottom) / 2,
        zoom,
      }),
      zoom,
    };
  };

  const updateCamera = (camera: THREE.OrthographicCamera, time: number): void => {
    if (!isEngaged) {
      return;
    }

    activeCamera = camera;

    const { cameraOffset, cameraTransitionDurationMs } =
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const { focus, zoom } = getCameraView(camera);

    if (cameraTransitionStartedAt === null) {
      if (camera.zoom !== zoom || camera.position.x !== focus.x + cameraOffset.x) {
        updateEntryExplorationCameraView(camera, focus, cameraOffset, zoom);
      }

      return;
    }

    cameraTransition ??= createSceneCameraTransition({
      camera,
      durationMs: cameraTransitionDurationMs,
      now: cameraTransitionStartedAt,
      toLookAt: new THREE.Vector3(focus.x, 0, focus.z),
      toPosition: new THREE.Vector3(
        focus.x + cameraOffset.x,
        cameraOffset.y,
        focus.z + cameraOffset.z
      ),
      toZoom: zoom,
    });

    const { done } = updateSceneCameraTransition(cameraTransition, time);

    if (!done) {
      return;
    }

    cameraTransition = null;
    cameraTransitionStartedAt = null;
    onCameraSettled?.();
  };

  const faceCharacterTowardMap = (): void => {
    if (!isEngaged || !characterModel) {
      return;
    }

    const characterPoint = { x: characterModel.position.x, z: characterModel.position.z };

    if (
      getEntryExplorationSceneDistance(characterPoint, getCharacterDestination()) >
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG.characterFacingDistance
    ) {
      return;
    }

    characterModel.rotation.y = toCharacterModelRotationRadians(
      getEntryExplorationSceneHeadingRadians(characterPoint, mapPosition)
    );
  };

  const updateTriggerState = (position: EntryExplorationScenePoint): void => {
    isCharacterInTrigger = isInsideSceneTriggerRadius({
      position,
      radius: seoulTileMapObject.interaction.triggerRadius,
      triggerPoint: triggerPosition,
    });

    if (!isCharacterInTrigger) {
      waitsForTriggerExit = false;
      return;
    }

    if (!isEngaged && !waitsForTriggerExit && getCollectedNumbers().length === 0) {
      waitsForTriggerExit = true;
      onEntryBlocked?.();
    }
  };

  return {
    activate,
    canActivate: () =>
      !isEngaged &&
      isCharacterInTrigger &&
      !waitsForTriggerExit &&
      getCollectedNumbers().length > 0,
    deactivate,
    dispose: () => {
      roulette.cancel();
      selectableLayer.dispose();
      disposeEntryExplorationObject3D(mapMesh);
    },
    getActivationCharacterDestination: getCharacterDestination,
    takeRequestedCharacterDestination: () => {
      const destination = requestedCharacterDestination;
      requestedCharacterDestination = null;

      return destination;
    },
    handlePointerDown: (raycaster) => {
      if (!isEngaged) {
        return false;
      }

      if (isRouletteMode || cameraTransitionStartedAt !== null || hasThrown) {
        return true;
      }

      const cell = resolvePointedCell(raycaster);

      if (!cell) {
        return true;
      }

      throwAtCell(cell, raycaster.camera);

      return true;
    },
    handlePointerMove: (raycaster) => {
      if (!isEngaged) {
        return false;
      }

      if (isRouletteMode || cameraTransitionStartedAt !== null) {
        setTargetHover(false);
        selectableLayer.setHoveredCell(null);

        return false;
      }

      const pointedCell = resolvePointedCell(raycaster);

      selectableLayer.setHoveredCell(pointedCell);
      setTargetHover(pointedCell !== null);

      return false;
    },
    handlePointerUp: () => false,
    isActive: () => isEngaged,
    object: mapMesh,
    priority: SEOUL_TILE_MAP_VIEW_PRIORITY,
    setCharacter: (character) => {
      characterModel = character;
    },
    setLayout,
    update: faceCharacterTowardMap,
    updateCamera,
    updateTriggerState,
  };
}

function getMapTexture(object: THREE.Object3D): THREE.Texture | null {
  if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshBasicMaterial)) {
    return null;
  }

  return object.material.map;
}

type EntryExplorationTileMapObject = Extract<
  (typeof ENTRY_EXPLORATION_SCENE_OBJECTS)[number],
  { interaction: unknown }
>;

function getSeoulTileMapObject(
  id: EntryExplorationTileMapObject["id"]
): EntryExplorationTileMapObject {
  const object = ENTRY_EXPLORATION_SCENE_OBJECTS.find((sceneObject) => sceneObject.id === id);

  if (!object || !("interaction" in object)) {
    throw new Error("Seoul tile map scene object is required.");
  }

  return object;
}
