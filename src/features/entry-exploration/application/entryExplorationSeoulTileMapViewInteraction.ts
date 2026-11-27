import * as THREE from "three";

import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import {
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
  getEntryExplorationTileMapCameraFillZoom,
  getEntryExplorationTileMapCameraFocus,
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
import { createEntryExplorationDartRoulette } from "./entryExplorationDartRoulette";
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

export type EntryExplorationDartViewportRect = EntryExplorationDartViewportPoint & {
  height: number;
  width: number;
};

export type EntryExplorationDartRouletteHighlight = {
  cell: SeoulGridCell;
  step: number;
};

export type EntryExplorationDartRouletteLayout = {
  // 지금 화면에서 지도의 위치. 카메라가 이동하는 동안 매 프레임 바뀐다.
  mapRect: EntryExplorationDartViewportRect;
  // 카메라 이동이 끝났을 때 지도의 위치.
  restMapRect: EntryExplorationDartViewportRect;
  selectableCells: readonly SeoulGridCell[];
};

export type EntryExplorationDartRouletteWin = {
  cell: SeoulGridCell;
  gridNumber: string;
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
  startRoulette: () => boolean;
  throwAtRandomCell: () => void;
};

export type EntryExplorationSeoulTileMapViewInteractionOptions = {
  getCollectedNumbers?: () => readonly number[];
  onEntryBlocked?: () => void;
  onActiveChange?: (isActive: boolean) => void;
  onCameraSettled?: () => void;
  onControlsReady?: (controls: EntryExplorationDartViewControls) => void;
  onDartThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onRouletteHighlight?: (highlight: EntryExplorationDartRouletteHighlight) => void;
  onRouletteLayoutChange?: (layout: EntryExplorationDartRouletteLayout) => void;
  onRouletteThrowResult?: (result: EntryExplorationDartThrowResult) => void;
  onRouletteWin?: (win: EntryExplorationDartRouletteWin) => void;
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
const VIEWPORT_RECT_EPSILON = 0.0001;

export function createEntryExplorationSeoulTileMapViewInteractionController({
  getCollectedNumbers = () => [],
  onEntryBlocked,
  onActiveChange,
  onCameraSettled,
  onControlsReady,
  onDartThrowResult,
  onRouletteHighlight,
  onRouletteLayoutChange,
  onRouletteThrowResult,
  onRouletteWin,
  onTargetHoverChange,
}: EntryExplorationSeoulTileMapViewInteractionOptions = {}): EntryExplorationSeoulTileMapViewInteractionController {
  const seoulTileMapObject = getSeoulTileMapObject();
  const mapSize = {
    depth: seoulTileMapObject.size.depth,
    width: seoulTileMapObject.size.width,
  };
  const mapMesh = createEntryExplorationSceneObject(seoulTileMapObject);
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
  let announcedRouletteLayout: EntryExplorationDartRouletteLayout | null = null;
  let mapPosition: EntryExplorationScenePoint;
  let triggerPosition: EntryExplorationScenePoint;

  const setLayout = (layout: EntryIntroLayout): void => {
    mapPosition = layout.objects[seoulTileMapObject.id];
    triggerPosition = layout.objects["archery-range"];
    mapMesh.position.setX(mapPosition.x).setZ(mapPosition.z);
  };

  setLayout(ENTRY_INTRO_LAYOUTS.pc);

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
    local: THREE.Vector3,
    camera: THREE.Camera
  ): EntryExplorationDartViewportPoint => {
    const projected = mapMesh.localToWorld(local.clone()).project(camera);

    return { x: (projected.x + 1) / 2, y: (1 - projected.y) / 2 };
  };

  const toMapViewportRect = (camera: THREE.Camera): EntryExplorationDartViewportRect => {
    const topLeft = toViewportPoint(
      new THREE.Vector3(-mapSize.width / 2, mapSize.depth / 2, 0),
      camera
    );
    const bottomRight = toViewportPoint(
      new THREE.Vector3(mapSize.width / 2, -mapSize.depth / 2, 0),
      camera
    );

    return {
      height: Math.abs(bottomRight.y - topLeft.y),
      width: Math.abs(bottomRight.x - topLeft.x),
      x: (topLeft.x + bottomRight.x) / 2,
      y: (topLeft.y + bottomRight.y) / 2,
    };
  };

  const restCamera = new THREE.OrthographicCamera();

  const announceRouletteLayout = (
    camera: THREE.OrthographicCamera,
    { focus, zoom }: EntryExplorationTileMapCameraView
  ): void => {
    restCamera.copy(camera);
    updateEntryExplorationCameraView(
      restCamera,
      focus,
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG.cameraOffset,
      zoom
    );
    mapMesh.updateMatrixWorld();
    camera.updateMatrixWorld();
    restCamera.updateMatrixWorld();

    const mapRect = toMapViewportRect(camera);
    const nextRestMapRect = toMapViewportRect(restCamera);
    const previous = announcedRouletteLayout;
    // 도착 위치가 그대로면 같은 객체를 넘겨서, 받는 쪽이 값 비교 없이 판 구조 변화만 알아채게 한다.
    const restMapRect =
      previous && isSameViewportRect(previous.restMapRect, nextRestMapRect)
        ? previous.restMapRect
        : nextRestMapRect;

    if (
      previous &&
      previous.restMapRect === restMapRect &&
      isSameViewportRect(previous.mapRect, mapRect)
    ) {
      return;
    }

    announcedRouletteLayout = { mapRect, restMapRect, selectableCells };
    onRouletteLayoutChange?.(announcedRouletteLayout);
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
    viewportPoint: toViewportPoint(toCellLocalPosition(cell, 0), camera),
  });

  const roulette = createEntryExplorationDartRoulette({
    getCells: () => selectableCells,
    onHighlight: (cell, step) => onRouletteHighlight?.({ cell, step }),
    onPicked: (cell) => {
      if (isEngaged && !hasThrown && activeCamera) {
        hasThrown = true;
        onRouletteThrowResult?.(toThrowResult(cell, activeCamera));
      }
    },
    onWin: (cell) => onRouletteWin?.({ cell, gridNumber: toSeoulGridNumber(cell) }),
  });

  const canThrow = (): boolean =>
    isEngaged && !hasThrown && cameraTransitionStartedAt === null && !roulette.isRunning();

  const throwAtCell = (cell: SeoulGridCell, camera: THREE.Camera): void => {
    hasThrown = true;
    setTargetHover(false);
    onDartThrowResult?.(toThrowResult(cell, camera));
  };

  const throwAtRandomCell = (): void => {
    const cell = pickRandomSeoulGridCell(Math.random, selectableCells);

    if (!canThrow() || !cell || !activeCamera) {
      return;
    }

    throwAtCell(cell, activeCamera);
  };

  const resetThrow = (): void => {
    hasThrown = false;
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
    if (!canThrow()) {
      return false;
    }

    roulette.start();

    return true;
  };

  onControlsReady?.({
    requestApproach,
    resetThrow,
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
    announcedRouletteLayout = null;
    waitsForTriggerExit = false;
    hasThrown = false;
    cameraTransition = null;
    cameraTransitionStartedAt = time;
    onActiveChange?.(true);
  };

  const deactivate = (): void => {
    roulette.cancel();
    isEngaged = false;
    announcedRouletteLayout = null;
    waitsForTriggerExit = true;
    hasThrown = false;
    cameraTransition = null;
    cameraTransitionStartedAt = null;
    setTargetHover(false);
    onActiveChange?.(false);
  };

  const getCharacterDestination = (): EntryExplorationScenePoint => {
    const { characterDestinationOffset } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

    return {
      x: mapPosition.x + characterDestinationOffset.x,
      z: mapPosition.z + characterDestinationOffset.z,
    };
  };

  const getMapCornerPoints = (): readonly EntryExplorationScenePoint[] => {
    const halfWidth = mapSize.width / 2;
    const halfDepth = mapSize.depth / 2;

    mapMesh.updateMatrixWorld();

    return [-1, 1].flatMap((xSign) =>
      [-1, 1].map((ySign) => {
        const corner = mapMesh.localToWorld(
          new THREE.Vector3(halfWidth * xSign, halfDepth * ySign, 0)
        );

        return { x: corner.x, z: corner.z };
      })
    );
  };

  const getCameraView = (camera: THREE.OrthographicCamera): EntryExplorationTileMapCameraView => {
    const { cameraNarrowViewportContentCenterRatio, cameraOffset } =
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
    const { contentCenterScreenRatio, heightUsageRatio, maxZoom, widthUsageRatio } =
      ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.camera;
    const points = getMapCornerPoints();
    const viewHalfHeight = (camera.top - camera.bottom) / 2;
    const viewHalfWidth = (camera.right - camera.left) / 2;
    const isPortraitViewport = viewHalfWidth < viewHalfHeight;
    // 세로 화면은 결과 안내가 아래를 덮으므로 지도를 화살 화면처럼 위쪽에 둔다.
    const centerScreenRatio = isPortraitViewport
      ? cameraNarrowViewportContentCenterRatio
      : contentCenterScreenRatio;
    const zoom = getEntryExplorationTileMapCameraFillZoom({
      cameraOffset,
      focusPoint: mapPosition,
      heightUsageRatio,
      maxZoom,
      points,
      viewHalfHeight,
      viewHalfWidth,
      widthUsageRatio,
    });

    return {
      focus: getEntryExplorationTileMapCameraFocus({
        cameraOffset,
        contentCenterScreenRatio: centerScreenRatio,
        focusPoint: mapPosition,
        points,
        viewHalfHeight,
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
    const cameraView = getCameraView(camera);
    const { focus, zoom } = cameraView;

    if (cameraTransitionStartedAt === null) {
      if (camera.zoom !== zoom || camera.position.x !== focus.x + cameraOffset.x) {
        updateEntryExplorationCameraView(camera, focus, cameraOffset, zoom);
      }

      announceRouletteLayout(camera, cameraView);

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

    // 진입하는 첫 프레임부터 판이 지도를 따라가도록 카메라 이동 중에도 위치를 알린다.
    announceRouletteLayout(camera, cameraView);

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

      const cell = canThrow() ? resolvePointedCell(raycaster) : null;

      if (cell) {
        throwAtCell(cell, raycaster.camera);
      }

      return true;
    },
    handlePointerMove: (raycaster) => {
      if (!isEngaged) {
        return false;
      }

      setTargetHover(canThrow() && resolvePointedCell(raycaster) !== null);

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

function isSameViewportRect(
  previous: EntryExplorationDartViewportRect,
  next: EntryExplorationDartViewportRect
): boolean {
  return (
    Math.abs(previous.x - next.x) < VIEWPORT_RECT_EPSILON &&
    Math.abs(previous.y - next.y) < VIEWPORT_RECT_EPSILON &&
    Math.abs(previous.width - next.width) < VIEWPORT_RECT_EPSILON &&
    Math.abs(previous.height - next.height) < VIEWPORT_RECT_EPSILON
  );
}

type EntryExplorationTileMapObject = Extract<
  (typeof ENTRY_EXPLORATION_SCENE_OBJECTS)[number],
  { interaction: unknown }
>;

function getSeoulTileMapObject(): EntryExplorationTileMapObject {
  const object = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
    (sceneObject) => sceneObject.id === ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID
  );

  if (!object || !("interaction" in object)) {
    throw new Error("Seoul tile map scene object is required.");
  }

  return object;
}
