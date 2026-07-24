import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import * as THREE from "three";

import {
  playCharacterAnimationClips,
  stopCharacterAnimationActions,
} from "@shared/lib/character/characterAnimationPlayer";
import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import type { CharacterMovementModelKey } from "@shared/lib/character/useCharacterMovementController";
import { useCharacterMovementController } from "@shared/lib/character/useCharacterMovementController";
import {
  createSceneCameraTransition,
  type CreateSceneCameraTransitionInput,
  type SceneCameraTransition,
  updateSceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";

import { loadEntryExplorationGltf } from "../application/entryExplorationGltfLoader";
import {
  addEntryExplorationLights,
  createEntryExplorationCamera,
  createEntryExplorationFloorMesh,
  createEntryExplorationRenderer,
  createEntryExplorationSceneObject,
  createEntryExplorationSubwayTrainMarker,
  disposeEntryExplorationObject3D,
  fitEntryExplorationCharacterModel,
  resizeEntryExplorationCamera,
  updateEntryExplorationCameraFocus,
  updateEntryExplorationSubwayTrainMarker,
} from "../application/entryExplorationThreeScene";
import { useEntryExplorationInteraction } from "../application/useEntryExplorationInteraction";
import {
  ENTRY_EXPLORATION_CHARACTER_ANIMATION_TIME_SCALE,
  ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST,
  ENTRY_EXPLORATION_SCENE_CONFIG,
} from "../config/entryExplorationSceneConfig";
import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID,
  type EntryExplorationFloorOverlayObject,
} from "../config/entryExplorationSceneObjects";
import { LINE2_SELECTION_CAMERA_PRESET } from "../config/line2SelectionConfig";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  interpolateEntryExplorationScenePoint,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";
import type { Line2RoutePoint } from "../domain/line2Station";
import { SubwaySelectionControls } from "./SubwaySelectionControls";

type SceneHandles = {
  camera: THREE.OrthographicCamera;
  character: THREE.Object3D | null;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
};

type EntryExplorationCameraPreset = Omit<CreateSceneCameraTransitionInput, "camera" | "now">;

const subwayMapObjectCandidate = ENTRY_EXPLORATION_SCENE_OBJECTS.find(
  (object) => object.id === ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID
);

if (!subwayMapObjectCandidate || subwayMapObjectCandidate.type !== "floorOverlay") {
  throw new Error("Subway route map scene object is required.");
}

const subwayMapObject: EntryExplorationFloorOverlayObject = subwayMapObjectCandidate;

export function EntryExplorationPage(): ReactElement {
  const activeActionsRef = useRef<THREE.AnimationAction[]>([]);
  const cameraFocusRef = useRef<EntryExplorationScenePoint>({ x: 0, z: 0 });
  const cameraTransitionRef = useRef<SceneCameraTransition | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentModelKeyRef = useRef<CharacterMovementModelKey>("idlePrimary");
  const headingRadiansRef = useRef(0);
  const isSubwayViewActiveRef = useRef(false);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const sceneHandlesRef = useRef<SceneHandles | null>(null);
  const subwayMapMeshRef = useRef<THREE.Mesh | null>(null);
  const subwayTrainMarkerRef = useRef<THREE.Mesh | null>(null);
  const [isSubwayViewReady, setIsSubwayViewReady] = useState(false);
  const interaction = useEntryExplorationInteraction();

  const applyScenePosition = useCallback((position: EntryExplorationScenePoint) => {
    const handles = sceneHandlesRef.current;

    if (!handles) {
      return;
    }

    handles.character?.position.set(position.x, 0, position.z);

    if (isSubwayViewActiveRef.current || cameraTransitionRef.current) {
      return;
    }

    cameraFocusRef.current = position;
    updateEntryExplorationCameraFocus(handles.camera, position);
  }, []);

  const startCameraTransition = useCallback((preset: EntryExplorationCameraPreset) => {
    const camera = sceneHandlesRef.current?.camera;

    if (!camera) {
      return;
    }

    cameraTransitionRef.current = createSceneCameraTransition({
      camera,
      now: performance.now(),
      ...preset,
    });
  }, []);

  const movement = useCharacterMovementController<EntryExplorationScenePoint>({
    arrivalRadius: ENTRY_EXPLORATION_SCENE_CONFIG.arrivalRadius,
    getDistance: getEntryExplorationSceneDistance,
    getHeadingRadians: getEntryExplorationSceneHeadingRadians,
    initialPosition: { x: 0, z: 0 },
    interpolate: interpolateEntryExplorationScenePoint,
    maxFrameDeltaSeconds: ENTRY_EXPLORATION_SCENE_CONFIG.maxFrameDeltaSeconds,
    onFrame: ({ position }) => {
      applyScenePosition(position);
      interaction.detectInteractionAtPoint(position);
    },
    speedPerSecond: ENTRY_EXPLORATION_SCENE_CONFIG.characterSpeedPerSecond,
  });
  const movementRef = useRef(movement);
  movementRef.current = movement;

  useEffect(() => {
    if (interaction.activeInteractionType !== "subwaySelection") {
      return;
    }

    movement.moveTo(subwayMapObject.position);
    isSubwayViewActiveRef.current = true;
    setIsSubwayViewReady(false);
    startCameraTransition(LINE2_SELECTION_CAMERA_PRESET);
  }, [interaction.activeInteractionType, movement.moveTo, startCameraTransition]);

  const handleSubwaySelectionClose = useCallback(() => {
    const currentPosition = movementRef.current.getCurrentPosition();

    isSubwayViewActiveRef.current = false;
    setIsSubwayViewReady(false);
    subwayTrainMarkerRef.current?.position.set(0, 0, 0.08);

    if (subwayTrainMarkerRef.current) {
      subwayTrainMarkerRef.current.visible = false;
    }

    interaction.closeInteraction();
    startCameraTransition({
      durationMs: ENTRY_EXPLORATION_SCENE_CONFIG.cameraTransitionDurationMs,
      toLookAt: new THREE.Vector3(currentPosition.x, 0, currentPosition.z),
      toPosition: new THREE.Vector3(
        currentPosition.x + ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset.x,
        ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset.y,
        currentPosition.z + ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset.z
      ),
      toZoom: 1,
    });
  }, [interaction.closeInteraction, startCameraTransition]);

  const handleSubwayTrainPositionChange = useCallback((position: Line2RoutePoint) => {
    const mapMesh = subwayMapMeshRef.current;
    const trainMarker = subwayTrainMarkerRef.current;

    if (!mapMesh || !trainMarker) {
      return;
    }

    updateEntryExplorationSubwayTrainMarker(trainMarker, subwayMapObject, position);
  }, []);

  const playAnimation = useCallback(async (nextModelKey: CharacterMovementModelKey) => {
    const mixer = mixerRef.current;

    if (!mixer) {
      return;
    }

    const animationPath = ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST.animations[nextModelKey];
    const animationGltf = await loadEntryExplorationGltf(animationPath);

    if (mixerRef.current !== mixer || currentModelKeyRef.current !== nextModelKey) {
      return;
    }

    stopCharacterAnimationActions(activeActionsRef.current);
    activeActionsRef.current = playCharacterAnimationClips(
      mixer,
      animationGltf.animations,
      ENTRY_EXPLORATION_CHARACTER_ANIMATION_TIME_SCALE[nextModelKey]
    );
  }, []);

  useEffect(() => {
    currentModelKeyRef.current = movement.modelKey;
    void playAnimation(movement.modelKey);
  }, [movement.modelKey, playAnimation]);

  useEffect(() => {
    headingRadiansRef.current = movement.headingRadians;

    const character = sceneHandlesRef.current?.character;

    if (character) {
      character.rotation.y = toCharacterModelRotationRadians(movement.headingRadians);
    }
  }, [movement.headingRadians]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof WebGLRenderingContext === "undefined") {
      return;
    }

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const scene = new THREE.Scene();
    const camera = createEntryExplorationCamera(width, height);
    const renderer = createEntryExplorationRenderer(width, height);
    const floor = createEntryExplorationFloorMesh();
    const sceneObjectMeshes = ENTRY_EXPLORATION_SCENE_OBJECTS.map(
      createEntryExplorationSceneObject
    );
    const subwayMapObjectIndex = ENTRY_EXPLORATION_SCENE_OBJECTS.findIndex(
      (object) => object.id === ENTRY_EXPLORATION_SUBWAY_MAP_OBJECT_ID
    );
    const subwayMapMesh = sceneObjectMeshes[subwayMapObjectIndex];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frameId = 0;
    let lastTime = performance.now();
    let disposed = false;

    container.append(renderer.domElement);

    addEntryExplorationLights(scene);
    scene.add(floor);
    sceneObjectMeshes.forEach((mesh) => {
      scene.add(mesh);
    });

    if (subwayMapMesh instanceof THREE.Mesh) {
      const trainMarker = createEntryExplorationSubwayTrainMarker();

      subwayMapMesh.add(trainMarker);
      subwayMapMeshRef.current = subwayMapMesh;
      subwayTrainMarkerRef.current = trainMarker;
    }

    updateEntryExplorationCameraFocus(camera, { x: 0, z: 0 });
    cameraFocusRef.current = { x: 0, z: 0 };
    sceneHandlesRef.current = { camera, character: null, renderer, scene };

    const resize = () => {
      const nextRect = container.getBoundingClientRect();
      const nextWidth = Math.max(nextRect.width, 1);
      const nextHeight = Math.max(nextRect.height, 1);

      resizeEntryExplorationCamera(camera, nextWidth, nextHeight);
      renderer.setSize(nextWidth, nextHeight, false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (interaction.getHasActiveInteraction() || cameraTransitionRef.current) {
        return;
      }

      const canvasRect = renderer.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      pointer.y = -(((event.clientY - canvasRect.top) / canvasRect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      const floorHit = raycaster.intersectObject(floor)[0];

      if (!floorHit) {
        return;
      }

      movementRef.current.moveTo({
        x: floorHit.point.x,
        z: floorHit.point.z,
      });
    };

    void loadEntryExplorationGltf(ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST.mesh).then((gltf) => {
      if (disposed) {
        return;
      }

      const model = gltf.scene;

      fitEntryExplorationCharacterModel(model);
      model.rotation.y = toCharacterModelRotationRadians(headingRadiansRef.current);
      model.traverse((object) => {
        object.castShadow = true;
      });
      scene.add(model);
      mixerRef.current = new THREE.AnimationMixer(model);
      sceneHandlesRef.current = { camera, character: model, renderer, scene };
      applyScenePosition(movementRef.current.getCurrentPosition());
      void playAnimation(currentModelKeyRef.current);
    });

    const render = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      const cameraTransition = cameraTransitionRef.current;

      lastTime = time;
      mixerRef.current?.update(deltaSeconds);

      if (cameraTransition) {
        const { done } = updateSceneCameraTransition(cameraTransition, time);

        if (done) {
          cameraFocusRef.current = {
            x: cameraTransition.toLookAt.x,
            z: cameraTransition.toLookAt.z,
          };
          cameraTransitionRef.current = null;

          if (isSubwayViewActiveRef.current) {
            setIsSubwayViewReady(true);
          }
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    frameId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      sceneHandlesRef.current = null;
      subwayMapMeshRef.current = null;
      subwayTrainMarkerRef.current = null;
      cameraTransitionRef.current = null;
      mixerRef.current = null;
      activeActionsRef.current = [];
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      cancelAnimationFrame(frameId);
      disposeEntryExplorationObject3D(floor);
      sceneObjectMeshes.forEach(disposeEntryExplorationObject3D);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [applyScenePosition, interaction.getHasActiveInteraction, playAnimation]);

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      {interaction.activeInteractionType === "subwaySelection" ? (
        <SubwaySelectionControls
          isInteractionLocked={!isSubwayViewReady}
          onClose={handleSubwaySelectionClose}
          onTrainPositionChange={handleSubwayTrainPositionChange}
        />
      ) : null}
    </main>
  );
}
