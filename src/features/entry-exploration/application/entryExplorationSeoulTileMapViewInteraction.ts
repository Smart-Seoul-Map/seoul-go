import * as THREE from "three";

import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
  type EntryExplorationFloorOverlayObject,
} from "../config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";
import {
  isSeoulGridCellValid,
  toSeoulGridCell,
  toSeoulGridNumber,
  type SeoulGridCell,
} from "../domain/seoulGridNumber";
import {
  createEntryExplorationSceneObject,
  disposeEntryExplorationObject3D,
} from "./entryExplorationThreeScene";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntryExplorationDartThrowResult = {
  cell: SeoulGridCell;
  gridNumber: string;
  isHit: boolean;
};

export type EntryExplorationSeoulTileMapViewInteractionOptions = {
  onActiveChange?: (isActive: boolean) => void;
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onTargetHoverChange?: (isOverValidCell: boolean) => void;
};

export type EntryExplorationSeoulTileMapViewInteractionController =
  EntryExplorationSceneInteractionController & {
    deactivate: () => void;
    isActive: () => boolean;
  };

const SEOUL_TILE_MAP_VIEW_PRIORITY = 30;
const seoulTileMapObject = getSeoulTileMapObject();
const mapSize = {
  depth: seoulTileMapObject.size.depth,
  width: seoulTileMapObject.size.width,
};

export function createEntryExplorationSeoulTileMapViewInteractionController({
  onActiveChange,
  onDartThrowResult,
  onTargetHoverChange,
}: EntryExplorationSeoulTileMapViewInteractionOptions = {}): EntryExplorationSeoulTileMapViewInteractionController {
  const mapMesh = createEntryExplorationSceneObject(seoulTileMapObject);
  let cameraTransition: SceneCameraTransition | null = null;
  let cameraTransitionStartedAt: number | null = null;
  let characterModel: THREE.Object3D | null = null;
  let isEngaged = false;
  let isCharacterInTrigger = false;
  let isOverValidCell = false;
  let waitsForTriggerExit = false;

  const resolveTarget = (raycaster: THREE.Raycaster): EntryExplorationDartThrowResult | null => {
    const hit = raycaster.intersectObject(mapMesh, false)[0];

    if (!hit) {
      return null;
    }

    const local = mapMesh.worldToLocal(hit.point.clone());
    const point = { u: local.x, v: local.y };
    const cell = toSeoulGridCell(point, mapSize);

    return {
      cell,
      gridNumber: toSeoulGridNumber(cell),
      isHit: isSeoulGridCellValid(cell),
    };
  };

  const setTargetHover = (nextIsOverValidCell: boolean): void => {
    if (isOverValidCell === nextIsOverValidCell) {
      return;
    }

    isOverValidCell = nextIsOverValidCell;
    onTargetHoverChange?.(isOverValidCell);
  };

  const activate = (time: number): void => {
    if (isEngaged) {
      return;
    }

    isEngaged = true;
    waitsForTriggerExit = false;
    cameraTransition = null;
    cameraTransitionStartedAt = time;
    onActiveChange?.(true);
  };

  const deactivate = (): void => {
    isEngaged = false;
    waitsForTriggerExit = true;
    cameraTransition = null;
    cameraTransitionStartedAt = null;
    setTargetHover(false);
    onActiveChange?.(false);
  };

  const updateCamera = (camera: THREE.OrthographicCamera, time: number): void => {
    if (!isEngaged || cameraTransitionStartedAt === null) {
      return;
    }

    const { cameraFocusOffset, cameraOffset, cameraTransitionDurationMs, cameraZoom } =
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const focus = {
      x: seoulTileMapObject.position.x + cameraFocusOffset.x,
      z: seoulTileMapObject.position.z + cameraFocusOffset.z,
    };

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
      toZoom: cameraZoom,
    });

    const { done } = updateSceneCameraTransition(cameraTransition, time);

    if (!done) {
      return;
    }

    cameraTransition = null;
    cameraTransitionStartedAt = null;
  };

  const getCharacterDestination = (): EntryExplorationScenePoint => ({
    x:
      seoulTileMapObject.position.x +
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG.characterDestinationOffset.x,
    z:
      seoulTileMapObject.position.z +
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG.characterDestinationOffset.z,
  });

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
      triggerPoint: seoulTileMapObject.position,
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

      const target = resolveTarget(raycaster);

      if (!target) {
        return false;
      }

      if (target.isHit) {
        onDartThrowResult?.(target);
      }

      return true;
    },
    handlePointerMove: (raycaster) => {
      if (!isEngaged) {
        return false;
      }

      setTargetHover(resolveTarget(raycaster)?.isHit === true);

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
