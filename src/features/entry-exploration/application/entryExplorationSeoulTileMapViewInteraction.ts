import * as THREE from "three";

import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import { ENTRY_EXPLORATION_ARCHERY_RANGE } from "../config/entryExplorationArcheryRange";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
  type EntryExplorationFloorOverlayObject,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
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
  isSeoulGridCellValid,
  toSeoulGridCell,
  toSeoulGridNumber,
  type SeoulGridCell,
} from "../domain/seoulGridNumber";
import { pickRandomSeoulGridCell } from "../domain/seoulGridRandomCell";
import { createEntryExplorationDartHitMarker } from "./entryExplorationDartHitMarker";
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
  resetThrow: () => void;
  setHitCell: (cell: SeoulGridCell | null) => void;
  throwAtRandomCell: () => void;
};

export type EntryExplorationSeoulTileMapViewInteractionOptions = {
  onActiveChange?: (isActive: boolean) => void;
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
const seoulTileMapObject = getSeoulTileMapObject();
const mapSize = {
  depth: seoulTileMapObject.size.depth,
  width: seoulTileMapObject.size.width,
};

export function createEntryExplorationSeoulTileMapViewInteractionController({
  onActiveChange,
  onControlsReady,
  onDartThrowResult,
  onTargetHoverChange,
}: EntryExplorationSeoulTileMapViewInteractionOptions = {}): EntryExplorationSeoulTileMapViewInteractionController {
  const mapMesh = createEntryExplorationSceneObject(seoulTileMapObject);
  const hitMarker = createEntryExplorationDartHitMarker();
  let activeCamera: THREE.OrthographicCamera | null = null;
  let cameraTransition: SceneCameraTransition | null = null;
  let cameraTransitionStartedAt: number | null = null;
  let characterModel: THREE.Object3D | null = null;
  let isEngaged = false;
  let isCharacterInTrigger = false;
  let hasThrown = false;
  let isOverValidCell = false;
  let waitsForTriggerExit = false;

  mapMesh.add(hitMarker.object);

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

    return isSeoulGridCellValid(cell) ? cell : null;
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

  const throwAtRandomCell = (): void => {
    if (!isEngaged || hasThrown || cameraTransitionStartedAt !== null || !activeCamera) {
      return;
    }

    const cell = pickRandomSeoulGridCell();

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
    hasThrown = false;
    setHitCell(null);
  };

  onControlsReady?.({ resetThrow, setHitCell, throwAtRandomCell });

  const activate = (time: number): void => {
    if (isEngaged) {
      return;
    }

    isEngaged = true;
    waitsForTriggerExit = false;
    hasThrown = false;
    setHitCell(null);
    cameraTransition = null;
    cameraTransitionStartedAt = time;
    onActiveChange?.(true);
  };

  const deactivate = (): void => {
    isEngaged = false;
    waitsForTriggerExit = true;
    hasThrown = false;
    setHitCell(null);
    cameraTransition = null;
    cameraTransitionStartedAt = null;
    setTargetHover(false);
    onActiveChange?.(false);
  };

  const getCharacterDestination = (): EntryExplorationScenePoint => {
    const { characterDestinationOffset } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    return {
      x: seoulTileMapObject.position.x + characterDestinationOffset.x,
      z: seoulTileMapObject.position.z + characterDestinationOffset.z,
    };
  };

  const getCameraFocus = (): EntryExplorationScenePoint => {
    const { cameraFocusOffset } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    return {
      x: seoulTileMapObject.position.x + cameraFocusOffset.x,
      z: seoulTileMapObject.position.z + cameraFocusOffset.z,
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
    const mapPoints = getEntryExplorationRectanglePoints(seoulTileMapObject.position, mapSize);
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
      getEntryExplorationSceneHeadingRadians(characterPoint, seoulTileMapObject.position)
    );
  };

  const updateTriggerState = (position: EntryExplorationScenePoint): void => {
    isCharacterInTrigger = isInsideSceneTriggerRadius({
      position,
      radius: seoulTileMapObject.interaction.triggerRadius,
      triggerPoint: ENTRY_EXPLORATION_ARCHERY_RANGE.position,
    });

    if (!isCharacterInTrigger) {
      waitsForTriggerExit = false;
    }
  };

  return {
    activate,
    canActivate: () => !isEngaged && isCharacterInTrigger && !waitsForTriggerExit,
    deactivate,
    dispose: () => {
      disposeEntryExplorationObject3D(mapMesh);
    },
    getActivationCharacterDestination: getCharacterDestination,
    handlePointerDown: (raycaster) => {
      if (!isEngaged) {
        return false;
      }

      if (cameraTransitionStartedAt !== null) {
        return true;
      }

      if (hasThrown) {
        return false;
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

      if (cameraTransitionStartedAt !== null) {
        setTargetHover(false);

        return false;
      }

      setTargetHover(resolvePointedCell(raycaster) !== null);

      return false;
    },
    handlePointerUp: () => false,
    isActive: () => isEngaged,
    object: mapMesh,
    priority: SEOUL_TILE_MAP_VIEW_PRIORITY,
    setCharacter: (character) => {
      characterModel = character;
    },
    update: faceCharacterTowardMap,
    updateCamera,
    updateTriggerState,
  };
}

function getSeoulTileMapObject(): EntryExplorationFloorOverlayObject & {
  interaction: NonNullable<EntryExplorationFloorOverlayObject["interaction"]>;
} {
  const object = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
    (sceneObject) => sceneObject.id === ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
  );

  if (!object || object.type !== "floorOverlay" || !object.interaction) {
    throw new Error("Seoul tile map scene object is required.");
  }

  return object;
}
