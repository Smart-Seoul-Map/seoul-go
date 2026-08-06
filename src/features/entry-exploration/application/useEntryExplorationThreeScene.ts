import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
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
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";

import {
  ENTRY_EXPLORATION_CHARACTER_ANIMATION_TIME_SCALE,
  ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST,
  ENTRY_EXPLORATION_SCENE_CONFIG,
} from "../config/entryExplorationSceneConfig";
import { ENTRY_EXPLORATION_INTRO_CONFIG } from "../config/entryExplorationIntroConfig";
import { ENTRY_EXPLORATION_SCENE_OBJECTS } from "../config/entryExplorationSceneObjects";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  interpolateEntryExplorationScenePoint,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntryExplorationIntroFloor } from "./entryExplorationIntroFloor";
import {
  addEntryExplorationLights,
  createEntryExplorationCamera,
  createEntryExplorationFloorMesh,
  createEntryExplorationRenderer,
  createEntryExplorationSceneObject,
  disposeEntryExplorationObject3D,
  fitEntryExplorationCharacterModel,
  resizeEntryExplorationCamera,
  updateEntryExplorationCameraFocus,
  updateEntryExplorationCameraView,
} from "./entryExplorationThreeScene";
import {
  type EntryExplorationSceneInteractionController,
  useEntryExplorationSceneInteractionRegistry,
} from "./useEntryExplorationSceneInteractionRegistry";

type SceneHandles = {
  camera: THREE.OrthographicCamera;
  character: THREE.Object3D | null;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
};

type EntryExplorationIntroStatus = "entering" | "ready" | "waiting";

export type UseEntryExplorationThreeSceneOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  createSceneInteractionControllers: () => EntryExplorationSceneInteractionController[];
  onSceneControlsReady?: (controls: EntryExplorationThreeSceneControls | null) => void;
};

export type EntryExplorationThreeSceneControls = {
  deactivateActiveInteraction: () => void;
  retryActiveInteraction: () => void;
};

export function useEntryExplorationThreeScene({
  containerRef,
  createSceneInteractionControllers,
  onSceneControlsReady,
}: UseEntryExplorationThreeSceneOptions): void {
  const activeActionsRef = useRef<THREE.AnimationAction[]>([]);
  const currentModelKeyRef = useRef<CharacterMovementModelKey>("idlePrimary");
  const headingRadiansRef = useRef(0);
  const introCameraTransitionRef = useRef<SceneCameraTransition | null>(null);
  const introStatusRef = useRef<EntryExplorationIntroStatus>("waiting");
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const sceneHandlesRef = useRef<SceneHandles | null>(null);
  const {
    activateReadySceneInteraction,
    addSceneInteractionObjects,
    clearSceneInteractionControllers,
    deactivateActiveSceneInteraction,
    disposeSceneInteractionControllers,
    handleSceneInteractionPointerDown,
    handleSceneInteractionPointerMove,
    handleSceneInteractionPointerUp,
    hasActiveSceneInteraction,
    releaseInactiveSceneInteraction,
    registerSceneInteractionControllers,
    retryActiveSceneInteraction,
    setSceneInteractionCharacter,
    updateActiveSceneInteractionCamera,
    updateSceneInteractions,
    updateSceneInteractionTriggers,
  } = useEntryExplorationSceneInteractionRegistry();

  const applyScenePosition = useCallback(
    (position: EntryExplorationScenePoint) => {
      const handles = sceneHandlesRef.current;

      if (!handles) {
        return;
      }

      handles.character?.position.set(position.x, 0, position.z);

      if (introStatusRef.current === "ready" && !hasActiveSceneInteraction()) {
        updateEntryExplorationCameraFocus(handles.camera, position);
      }
    },
    [hasActiveSceneInteraction]
  );

  const movement = useCharacterMovementController<EntryExplorationScenePoint>({
    arrivalRadius: ENTRY_EXPLORATION_SCENE_CONFIG.arrivalRadius,
    getDistance: getEntryExplorationSceneDistance,
    getHeadingRadians: getEntryExplorationSceneHeadingRadians,
    initialPosition: ENTRY_EXPLORATION_INTRO_CONFIG.characterSpawnPosition,
    interpolate: interpolateEntryExplorationScenePoint,
    maxFrameDeltaSeconds: ENTRY_EXPLORATION_SCENE_CONFIG.maxFrameDeltaSeconds,
    onFrame: ({ position }) => {
      applyScenePosition(position);
    },
    onArrive: ({ target }) => {
      if (
        introStatusRef.current !== "entering" ||
        getEntryExplorationSceneDistance(
          target,
          ENTRY_EXPLORATION_INTRO_CONFIG.characterTargetPosition
        ) > ENTRY_EXPLORATION_SCENE_CONFIG.arrivalRadius
      ) {
        return;
      }

      introStatusRef.current = "ready";
      introCameraTransitionRef.current = null;

      const handles = sceneHandlesRef.current;
      if (!handles) {
        return;
      }

      handles.renderer.domElement.setAttribute("aria-label", "서울 탐방 공간");
      handles.renderer.domElement.removeAttribute("aria-busy");
      handles.renderer.domElement.removeAttribute("aria-disabled");
      handles.renderer.domElement.removeAttribute("role");
      handles.renderer.domElement.tabIndex = -1;
      updateEntryExplorationCameraView(
        handles.camera,
        ENTRY_EXPLORATION_INTRO_CONFIG.camera.finalFocusPosition,
        ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset,
        1
      );
    },
    speedPerSecond: ENTRY_EXPLORATION_SCENE_CONFIG.characterSpeedPerSecond,
  });
  const movementRef = useRef(movement);
  movementRef.current = movement;

  const restoreCameraToCurrentPosition = useCallback(() => {
    const handles = sceneHandlesRef.current;

    if (!handles) {
      return;
    }

    updateEntryExplorationCameraFocus(handles.camera, movementRef.current.getCurrentPosition());
  }, []);

  const deactivateActiveInteraction = useCallback(() => {
    if (deactivateActiveSceneInteraction()) {
      restoreCameraToCurrentPosition();
    }
  }, [deactivateActiveSceneInteraction, restoreCameraToCurrentPosition]);

  const retryActiveInteraction = useCallback(() => {
    retryActiveSceneInteraction();
  }, [retryActiveSceneInteraction]);

  useEffect(() => {
    onSceneControlsReady?.({
      deactivateActiveInteraction,
      retryActiveInteraction,
    });

    return () => {
      onSceneControlsReady?.(null);
    };
  }, [deactivateActiveInteraction, onSceneControlsReady, retryActiveInteraction]);

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
    const introFloor = createEntryExplorationIntroFloor();
    const sceneObjectMeshes = ENTRY_EXPLORATION_SCENE_OBJECTS.filter(
      (object) => !("interaction" in object)
    ).map(createEntryExplorationSceneObject);
    let frameId = 0;
    let lastTime = performance.now();
    let disposed = false;
    const sceneInteractionControllers = createSceneInteractionControllers();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    container.append(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", "서울 탐방 시작하기");
    renderer.domElement.setAttribute("aria-disabled", "true");
    renderer.domElement.setAttribute("role", "button");

    addEntryExplorationLights(scene);
    scene.add(floor);
    scene.add(introFloor.object);
    sceneObjectMeshes.forEach((mesh) => {
      scene.add(mesh);
    });
    registerSceneInteractionControllers(sceneInteractionControllers);
    addSceneInteractionObjects(scene);
    updateEntryExplorationCameraView(
      camera,
      ENTRY_EXPLORATION_INTRO_CONFIG.camera.focusPosition,
      ENTRY_EXPLORATION_INTRO_CONFIG.camera.offset,
      ENTRY_EXPLORATION_INTRO_CONFIG.camera.zoom
    );
    sceneHandlesRef.current = { camera, character: null, renderer, scene };

    const resize = () => {
      const nextRect = container.getBoundingClientRect();
      const nextWidth = Math.max(nextRect.width, 1);
      const nextHeight = Math.max(nextRect.height, 1);

      resizeEntryExplorationCamera(camera, nextWidth, nextHeight);
      renderer.setSize(nextWidth, nextHeight, false);
    };

    const updateRaycasterFromPointerEvent = (event: PointerEvent) => {
      const canvasRect = renderer.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      pointer.y = -(((event.clientY - canvasRect.top) / canvasRect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
    };

    const startIntro = (time: number): boolean => {
      if (introStatusRef.current !== "waiting" || !sceneHandlesRef.current?.character) {
        return false;
      }

      const characterTarget = ENTRY_EXPLORATION_INTRO_CONFIG.characterTargetPosition;
      const cameraTarget = ENTRY_EXPLORATION_INTRO_CONFIG.camera.finalFocusPosition;
      const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;

      introStatusRef.current = "entering";
      introFloor.setButtonPressed();
      renderer.domElement.style.cursor = "default";
      renderer.domElement.setAttribute("aria-label", "서울 탐방을 시작하는 중");
      renderer.domElement.setAttribute("aria-busy", "true");
      renderer.domElement.setAttribute("aria-disabled", "true");
      introCameraTransitionRef.current = createSceneCameraTransition({
        camera,
        durationMs: ENTRY_EXPLORATION_INTRO_CONFIG.camera.transitionDurationMs,
        fromLookAt: new THREE.Vector3(
          ENTRY_EXPLORATION_INTRO_CONFIG.camera.focusPosition.x,
          0,
          ENTRY_EXPLORATION_INTRO_CONFIG.camera.focusPosition.z
        ),
        now: time,
        toLookAt: new THREE.Vector3(cameraTarget.x, 0, cameraTarget.z),
        toPosition: new THREE.Vector3(
          cameraTarget.x + cameraOffset.x,
          cameraOffset.y,
          cameraTarget.z + cameraOffset.z
        ),
        toZoom: 1,
      });
      movementRef.current.moveTo(characterTarget);

      return true;
    };

    const handlePointerDown = (event: PointerEvent) => {
      updateRaycasterFromPointerEvent(event);

      if (introStatusRef.current === "waiting") {
        const buttonHit = raycaster.intersectObject(introFloor.buttonMesh, false)[0];

        if (buttonHit) {
          startIntro(performance.now());
        }

        return;
      }

      if (introStatusRef.current === "entering") {
        return;
      }

      const handledByInteraction = handleSceneInteractionPointerDown(raycaster, performance.now());

      if (handledByInteraction) {
        return;
      }

      if (hasActiveSceneInteraction()) {
        deactivateActiveInteraction();
        return;
      }

      const floorHit = raycaster.intersectObject(floor)[0];

      if (!floorHit) {
        return;
      }

      movementRef.current.moveTo({
        x: floorHit.point.x,
        z: floorHit.point.z,
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateRaycasterFromPointerEvent(event);

      if (introStatusRef.current === "waiting") {
        const isButtonHovered =
          Boolean(sceneHandlesRef.current?.character) &&
          raycaster.intersectObject(introFloor.buttonMesh, false).length > 0;

        renderer.domElement.style.cursor = isButtonHovered ? "pointer" : "default";
        return;
      }

      if (introStatusRef.current === "entering") {
        return;
      }

      handleSceneInteractionPointerMove(raycaster);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (introStatusRef.current !== "ready") {
        return;
      }

      updateRaycasterFromPointerEvent(event);
      handleSceneInteractionPointerUp(raycaster, performance.now());
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      if (startIntro(performance.now())) {
        event.preventDefault();
      }
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
      setSceneInteractionCharacter(model);
      mixerRef.current = new THREE.AnimationMixer(model);
      sceneHandlesRef.current = { camera, character: model, renderer, scene };
      renderer.domElement.setAttribute("aria-disabled", "false");
      applyScenePosition(movementRef.current.getCurrentPosition());
      void playAnimation(currentModelKeyRef.current);
    });

    const render = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      const characterPosition = movementRef.current.getCurrentPosition();

      lastTime = time;
      mixerRef.current?.update(deltaSeconds);

      if (introCameraTransitionRef.current) {
        const transitionResult = updateSceneCameraTransition(
          introCameraTransitionRef.current,
          time
        );

        if (transitionResult.done) {
          introCameraTransitionRef.current = null;
        }
      }

      if (introStatusRef.current === "ready" && !hasActiveSceneInteraction()) {
        updateSceneInteractionTriggers(characterPosition);
        activateReadySceneInteraction(time, (controller) => {
          const characterDestination = controller.getActivationCharacterDestination?.();

          if (characterDestination) {
            movementRef.current.moveTo(characterDestination);
            return;
          }

          movementRef.current.stop();
        });
      }

      if (introStatusRef.current === "ready") {
        updateSceneInteractions(time);
      }

      if (introStatusRef.current === "ready" && releaseInactiveSceneInteraction()) {
        updateEntryExplorationCameraFocus(camera, movementRef.current.getCurrentPosition());
      }

      if (introStatusRef.current === "ready") {
        updateActiveSceneInteractionCamera(camera, time, characterPosition);
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("keydown", handleKeyDown);
    frameId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      sceneHandlesRef.current = null;
      introCameraTransitionRef.current = null;
      introStatusRef.current = "waiting";
      mixerRef.current = null;
      activeActionsRef.current = [];
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(frameId);
      disposeEntryExplorationObject3D(floor);
      introFloor.cancelPendingRefresh();
      disposeEntryExplorationObject3D(introFloor.object);
      sceneObjectMeshes.forEach(disposeEntryExplorationObject3D);
      disposeSceneInteractionControllers();
      clearSceneInteractionControllers();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [
    activateReadySceneInteraction,
    addSceneInteractionObjects,
    applyScenePosition,
    clearSceneInteractionControllers,
    containerRef,
    createSceneInteractionControllers,
    deactivateActiveInteraction,
    disposeSceneInteractionControllers,
    handleSceneInteractionPointerDown,
    handleSceneInteractionPointerMove,
    handleSceneInteractionPointerUp,
    hasActiveSceneInteraction,
    playAnimation,
    releaseInactiveSceneInteraction,
    registerSceneInteractionControllers,
    setSceneInteractionCharacter,
    updateActiveSceneInteractionCamera,
    updateSceneInteractions,
    updateSceneInteractionTriggers,
  ]);
}
