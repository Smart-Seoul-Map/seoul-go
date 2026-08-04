import * as THREE from "three";

import { easeOutCubic } from "@shared/lib/animation/easing";
import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID,
  type EntryExplorationFloorOverlayObject,
} from "../config/entryExplorationSceneObjects";
import {
  LINE2_BRANCH_STATION_IDS,
  LINE2_INITIAL_STATION_ID,
  LINE2_MAIN_LOOP_STATION_IDS,
  LINE2_SELECTION_ANIMATION_DURATION_MS,
  LINE2_SELECTION_CAMERA_PRESET,
  LINE2_SELECTION_CHARACTER_DESTINATION_OFFSET,
  LINE2_STATIONS,
} from "../config/line2SelectionConfig";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import {
  createLine2SelectionRoute,
  getLine2RoutePointAtProgress,
  selectRandomLine2Station,
  type Line2RoutePoint,
  type Line2Station,
} from "../domain/line2Station";
import {
  createEntryExplorationSubwayTrainMarker,
  updateEntryExplorationSubwayTrainMarker,
} from "./entryExplorationSubwayTrainMarker";
import {
  createEntryExplorationSceneObject,
  disposeEntryExplorationObject3D,
} from "./entryExplorationThreeScene";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntryExplorationSubwaySelectionStatus = "idle" | "selecting" | "selected";

export type EntryExplorationSubwaySelectionState = {
  isActive: boolean;
  isCameraReady: boolean;
  selectedStation: Line2Station | null;
  status: EntryExplorationSubwaySelectionStatus;
};

export type EntryExplorationSubwaySelectionInteractionOptions = {
  onStateChange?: (state: EntryExplorationSubwaySelectionState) => void;
  random?: () => number;
};

export type EntryExplorationSubwaySelectionInteractionController =
  EntryExplorationSceneInteractionController & {
    deactivate: (time?: number) => void;
    getState: () => EntryExplorationSubwaySelectionState;
    isActive: () => boolean;
    selectStation: (time: number) => void;
  };

type SelectionAnimation = {
  route: readonly Line2Station[];
  startedAt: number;
  targetStation: Line2Station;
};

type CameraTransitionPhase = "activating" | "deactivating";

const SUBWAY_SELECTION_PRIORITY = 50;
const subwayMapObject = getSubwayMapObject();
const initialStation =
  LINE2_STATIONS.find((station) => station.id === LINE2_INITIAL_STATION_ID) ?? LINE2_STATIONS[0];

export function createEntryExplorationSubwaySelectionInitialState(): EntryExplorationSubwaySelectionState {
  return {
    isActive: false,
    isCameraReady: false,
    selectedStation: null,
    status: "idle",
  };
}

export function createEntryExplorationSubwaySelectionInteractionController({
  onStateChange,
  random = Math.random,
}: EntryExplorationSubwaySelectionInteractionOptions = {}): EntryExplorationSubwaySelectionInteractionController {
  const mapObject = createEntryExplorationSceneObject(subwayMapObject);
  const trainMarker = createEntryExplorationSubwayTrainMarker();
  let cameraTransition: SceneCameraTransition | null = null;
  let cameraTransitionPhase: CameraTransitionPhase | null = null;
  let cameraTransitionStartedAt: number | null = null;
  let currentStationId = initialStation.id;
  let isEngaged = false;
  let isCameraReady = false;
  let isCharacterInTrigger = false;
  let isViewActive = false;
  let waitsForTriggerExit = false;
  let selectionAnimation: SelectionAnimation | null = null;
  let selectedStation: Line2Station | null = null;
  let status: EntryExplorationSubwaySelectionStatus = "idle";
  let trainPosition = initialStation.diagramPosition;

  mapObject.add(trainMarker);
  trainMarker.visible = false;

  const getState = (): EntryExplorationSubwaySelectionState => ({
    isActive: isViewActive,
    isCameraReady,
    selectedStation,
    status,
  });

  const emitState = (): void => {
    onStateChange?.(getState());
  };

  const updateTrainPosition = (position: Line2RoutePoint): void => {
    trainPosition = position;
    updateEntryExplorationSubwayTrainMarker(trainMarker, subwayMapObject, position);
  };

  const activate = (time: number): void => {
    if (isEngaged) {
      return;
    }

    isEngaged = true;
    isViewActive = true;
    isCameraReady = false;
    waitsForTriggerExit = false;
    cameraTransition = null;
    cameraTransitionPhase = "activating";
    cameraTransitionStartedAt = time;
    updateTrainPosition(trainPosition);
    emitState();
  };

  const deactivate = (time = performance.now()): void => {
    if (!isViewActive) {
      return;
    }

    isViewActive = false;
    isCameraReady = false;
    waitsForTriggerExit = true;
    cameraTransition = null;
    cameraTransitionPhase = "deactivating";
    cameraTransitionStartedAt = time;
    currentStationId = initialStation.id;
    selectionAnimation = null;
    selectedStation = null;
    status = "idle";
    trainPosition = initialStation.diagramPosition;
    trainMarker.visible = false;
    emitState();
  };

  const selectStation = (time: number): void => {
    if (!isViewActive || !isCameraReady || selectionAnimation) {
      return;
    }

    const targetStation = selectRandomLine2Station(LINE2_STATIONS, random);
    const route = createLine2SelectionRoute({
      branchStationIds: LINE2_BRANCH_STATION_IDS,
      mainLoopStationIds: LINE2_MAIN_LOOP_STATION_IDS,
      startStationId: currentStationId,
      stations: LINE2_STATIONS,
      targetStationId: targetStation.id,
    });

    selectedStation = targetStation;
    status = "selecting";
    selectionAnimation = {
      route,
      startedAt: time,
      targetStation,
    };
    emitState();
  };

  const updateSelection = (time: number): void => {
    if (!selectionAnimation) {
      return;
    }

    const progress = Math.min(
      Math.max((time - selectionAnimation.startedAt) / LINE2_SELECTION_ANIMATION_DURATION_MS, 0),
      1
    );
    const nextPosition = getLine2RoutePointAtProgress(
      selectionAnimation.route,
      easeOutCubic(progress)
    );

    updateTrainPosition(nextPosition);

    if (progress < 1) {
      return;
    }

    currentStationId = selectionAnimation.targetStation.id;
    selectedStation = selectionAnimation.targetStation;
    selectionAnimation = null;
    status = "selected";
    emitState();
  };

  const updateCamera = (
    camera: THREE.OrthographicCamera,
    time: number,
    characterPosition: EntryExplorationScenePoint
  ): void => {
    if (!isEngaged || cameraTransitionPhase === null || cameraTransitionStartedAt === null) {
      return;
    }

    const isActivating = cameraTransitionPhase === "activating";
    const cameraFocus = new THREE.Vector3(characterPosition.x, 0, characterPosition.z);
    const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;

    cameraTransition ??= createSceneCameraTransition(
      isActivating
        ? {
            camera,
            durationMs: LINE2_SELECTION_CAMERA_PRESET.durationMs,
            now: cameraTransitionStartedAt,
            toLookAt: LINE2_SELECTION_CAMERA_PRESET.toLookAt,
            toPosition: LINE2_SELECTION_CAMERA_PRESET.toPosition,
            toZoom: LINE2_SELECTION_CAMERA_PRESET.toZoom,
          }
        : {
            camera,
            durationMs: ENTRY_EXPLORATION_SCENE_CONFIG.cameraTransitionDurationMs,
            now: cameraTransitionStartedAt,
            toLookAt: cameraFocus,
            toPosition: new THREE.Vector3(
              characterPosition.x + cameraOffset.x,
              cameraOffset.y,
              characterPosition.z + cameraOffset.z
            ),
            toZoom: 1,
          }
    );

    const { done } = updateSceneCameraTransition(cameraTransition, time);

    if (!done) {
      return;
    }

    cameraTransition = null;

    if (isActivating) {
      cameraTransitionPhase = null;
      isCameraReady = true;
      emitState();
      return;
    }

    cameraTransitionPhase = null;
    cameraTransitionStartedAt = null;
    isEngaged = false;
  };

  const updateTriggerState = (position: EntryExplorationScenePoint): void => {
    isCharacterInTrigger = isInsideSceneTriggerRadius({
      position,
      radius: subwayMapObject.interaction.triggerRadius,
      triggerPoint: subwayMapObject.position,
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
      disposeEntryExplorationObject3D(mapObject);
    },
    getActivationCharacterDestination: () => ({
      x: subwayMapObject.position.x + LINE2_SELECTION_CHARACTER_DESTINATION_OFFSET.x,
      z: subwayMapObject.position.z + LINE2_SELECTION_CHARACTER_DESTINATION_OFFSET.z,
    }),
    getState,
    handlePointerDown: () => isEngaged,
    handlePointerMove: () => isEngaged,
    handlePointerUp: () => isEngaged,
    isActive: () => isEngaged,
    object: mapObject,
    priority: SUBWAY_SELECTION_PRIORITY,
    selectStation,
    update: updateSelection,
    updateCamera,
    updateTriggerState,
  };
}

function getSubwayMapObject(): EntryExplorationFloorOverlayObject & {
  interaction: NonNullable<EntryExplorationFloorOverlayObject["interaction"]>;
} {
  const object = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
    (sceneObject) => sceneObject.id === ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID
  );

  if (!object || object.type !== "floorOverlay" || !object.interaction) {
    throw new Error("Subway route map scene object is required.");
  }

  return object;
}
