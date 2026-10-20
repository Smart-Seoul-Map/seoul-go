import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import { track } from "@shared/lib/analytics/analytics";
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
import { ENTRY_EXPLORATION_SCENE_OBJECTS } from "../config/entryExplorationSceneObjects";
import { ENTRY_HANOK_PLACE_ID } from "../config/entryHanokPlace";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import type { EntryExplorationPlaceVisit } from "../domain/entryExplorationPlaceVisit";
import type { EntryEditionPlace, EntryExplorationPlaceId } from "../domain/entryEditionPlace";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  interpolateEntryExplorationScenePoint,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";
import { resolveEntryIntroLayout } from "../domain/entryIntroLayout";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import {
  createEntryExplorationIntroFloor,
  isEntryExplorationIntroTitleUv,
} from "./entryExplorationIntroFloor";
import { createEntryExplorationScenery } from "./entryExplorationScenery";
import { createEntryEditionScenery } from "./entryEditionScenery";
import { createEntryExplorationGuideArrow } from "./entryExplorationGuideArrow";
import { getEntryExplorationIntroTheme } from "./entryExplorationIntroTheme";
import { createEntryExplorationArcheryRange } from "./entryExplorationArcheryRange";
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
  places?: readonly EntryEditionPlace[] | null;
  containerRef: RefObject<HTMLDivElement | null>;
  createSceneInteractionControllers: () => EntryExplorationSceneInteractionController[];
  onSceneControlsReady?: (controls: EntryExplorationThreeSceneControls | null) => void;
  onIntroStart?: () => void;
  onIntroBlocked?: () => void;
  placeVisits?: Record<EntryExplorationPlaceId, EntryExplorationPlaceVisit>;
  onPlacePanelDismiss?: () => boolean;
  onCharacterMovingChange?: (isMoving: boolean) => void;
  characterSpeechAnchor?: THREE.Object3D;
};

export type EntryExplorationThreeSceneControls = {
  deactivateActiveInteraction: () => void;
};

export function useEntryExplorationThreeScene({
  places = null,
  containerRef,
  createSceneInteractionControllers,
  onSceneControlsReady,
  onIntroStart,
  onIntroBlocked,
  placeVisits,
  onPlacePanelDismiss,
  onCharacterMovingChange,
  characterSpeechAnchor,
}: UseEntryExplorationThreeSceneOptions): void {
  const activeActionsRef = useRef<THREE.AnimationAction[]>([]);
  const onIntroStartRef = useRef(onIntroStart);
  onIntroStartRef.current = onIntroStart;
  const onPlacePanelDismissRef = useRef(onPlacePanelDismiss);
  onPlacePanelDismissRef.current = onPlacePanelDismiss;
  const onCharacterMovingChangeRef = useRef(onCharacterMovingChange);
  onCharacterMovingChangeRef.current = onCharacterMovingChange;
  const onIntroBlockedRef = useRef(onIntroBlocked);
  onIntroBlockedRef.current = onIntroBlocked;
  const placesRef = useRef(places);
  placesRef.current = places;
  const placeVisitsRef = useRef(placeVisits);
  placeVisitsRef.current = placeVisits;
  const startPendingIntroRef = useRef<(() => void) | null>(null);
  const currentModelKeyRef = useRef<CharacterMovementModelKey>("idlePrimary");
  const headingRadiansRef = useRef(0);
  const guideArrowRef = useRef<ReturnType<typeof createEntryExplorationGuideArrow> | null>(null);
  const cameraTransitionRef = useRef<SceneCameraTransition | null>(null);
  const introStatusRef = useRef<EntryExplorationIntroStatus>("waiting");
  const introTargetRef = useRef<EntryExplorationScenePoint>(
    ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition
  );
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const sceneHandlesRef = useRef<SceneHandles | null>(null);
  const {
    activateReadySceneInteraction,
    addSceneInteractionObjects,
    clearSceneInteractionControllers,
    deactivateActiveSceneInteraction,
    disposeSceneInteractionControllers,
    getSceneInteractionPointerDestination,
    handleSceneInteractionPointerDown,
    handleSceneInteractionPointerMove,
    handleSceneInteractionPointerUp,
    hasActiveSceneInteraction,
    releaseInactiveSceneInteraction,
    registerSceneInteractionControllers,
    setSceneInteractionCharacter,
    setSceneInteractionLayout,
    takeSceneInteractionCharacterDestination,
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
    initialPosition: ENTRY_EXPLORATION_SCENE_CONFIG.intro.characterSpawnPosition,
    interpolate: interpolateEntryExplorationScenePoint,
    maxFrameDeltaSeconds: ENTRY_EXPLORATION_SCENE_CONFIG.maxFrameDeltaSeconds,
    onFrame: ({ position }) => {
      applyScenePosition(position);
    },
    onArrive: ({ position }) => {
      if (
        introStatusRef.current !== "entering" ||
        getEntryExplorationSceneDistance(position, introTargetRef.current) >
          ENTRY_EXPLORATION_SCENE_CONFIG.arrivalRadius
      ) {
        return;
      }

      introStatusRef.current = "ready";
      cameraTransitionRef.current = null;

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
        introTargetRef.current,
        ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset,
        1
      );
      guideArrowRef.current?.start(
        performance.now(),
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
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

    const { x, z } = movementRef.current.getCurrentPosition();
    const { cameraOffset, cameraTransitionDurationMs } = ENTRY_EXPLORATION_SCENE_CONFIG;

    cameraTransitionRef.current = createSceneCameraTransition({
      camera: handles.camera,
      durationMs: cameraTransitionDurationMs,
      now: performance.now(),
      toLookAt: new THREE.Vector3(x, 0, z),
      toPosition: new THREE.Vector3(x + cameraOffset.x, cameraOffset.y, z + cameraOffset.z),
      toZoom: 1,
    });
  }, []);

  const deactivateActiveInteraction = useCallback(() => {
    if (deactivateActiveSceneInteraction()) {
      restoreCameraToCurrentPosition();
    }
  }, [deactivateActiveSceneInteraction, restoreCameraToCurrentPosition]);

  useEffect(() => {
    placesRef.current = places;
    startPendingIntroRef.current?.();
  }, [places]);

  useEffect(() => {
    onSceneControlsReady?.({ deactivateActiveInteraction });

    return () => {
      onSceneControlsReady?.(null);
    };
  }, [deactivateActiveInteraction, onSceneControlsReady]);

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
    onCharacterMovingChangeRef.current?.(movement.modelKey === "walk");
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
    Object.values(placeVisitsRef.current ?? {}).forEach((visit) => visit.reset());
    const camera = createEntryExplorationCamera(width, height);
    const renderer = createEntryExplorationRenderer(width, height);
    const floor = createEntryExplorationFloorMesh();
    const introFloor = createEntryExplorationIntroFloor();
    const scenery = createEntryExplorationScenery();
    let editionScenery: ReturnType<typeof createEntryEditionScenery> | null = null;
    const hanok = scenery.object.getObjectByName(`entry-scenery-${ENTRY_HANOK_PLACE_ID}`);
    const visitLandmarks = new Map<string, THREE.Object3D>();
    if (hanok) visitLandmarks.set(ENTRY_HANOK_PLACE_ID, hanok);
    const labels = new CSS2DRenderer();
    labels.setSize(width, height);
    labels.domElement.className = "EntryEditionLabels";
    labels.domElement.style.pointerEvents = "none";
    labels.domElement.hidden = true;
    const archeryRange = createEntryExplorationArcheryRange();
    const surroundings = new THREE.Group();
    surroundings.name = "entry-exploration-surroundings";
    const staticSceneObjects = ENTRY_EXPLORATION_SCENE_OBJECTS.filter(
      (object) => !("interaction" in object)
    );
    const sceneObjectMeshes = staticSceneObjects.map(createEntryExplorationSceneObject);
    let frameId = 0;
    let lastTime = performance.now();
    let disposed = false;
    let hasPendingIntroStart = false;
    const sceneInteractionControllers = createSceneInteractionControllers();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const applyLayout = (aspect: number): EntryExplorationScenePoint | null => {
      const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, aspect);

      introFloor.applyLayout(layout, aspect);
      scenery.applyLayout(layout);
      archeryRange.applyLayout(layout);
      staticSceneObjects.forEach((object, index) => {
        const point = layout.objects[object.id];
        sceneObjectMeshes[index].position.setX(point.x).setZ(point.z);
      });
      setSceneInteractionLayout(layout);

      return editionScenery?.applyLayout(layout) ?? null;
    };

    container.append(renderer.domElement);
    container.append(labels.domElement);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", "서울 탐방 시작하기");
    renderer.domElement.setAttribute("aria-disabled", "true");
    renderer.domElement.setAttribute("role", "button");

    addEntryExplorationLights(scene);
    scene.add(floor);
    surroundings.add(introFloor.object, scenery.object, archeryRange.object);
    sceneObjectMeshes.forEach((mesh) => {
      surroundings.add(mesh);
    });
    scene.add(surroundings);
    const introHiddenObjects = [
      scenery.object,
      archeryRange.object,
      ...sceneObjectMeshes,
      ...sceneInteractionControllers.map((controller) => controller.object),
    ];
    introHiddenObjects.forEach((object) => (object.visible = false));
    registerSceneInteractionControllers(sceneInteractionControllers);
    addSceneInteractionObjects(scene, renderer);
    applyLayout(width / height);
    updateEntryExplorationCameraView(
      camera,
      introFloor.getCenter(),
      ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.offset,
      ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.zoom
    );
    sceneHandlesRef.current = { camera, character: null, renderer, scene };

    const resize = () => {
      const nextRect = container.getBoundingClientRect();
      const nextWidth = Math.max(nextRect.width, 1);
      const nextHeight = Math.max(nextRect.height, 1);

      resizeEntryExplorationCamera(camera, nextWidth, nextHeight);
      renderer.setSize(nextWidth, nextHeight, false);
      labels.setSize(nextWidth, nextHeight);

      if (introStatusRef.current !== "waiting") return;

      applyLayout(nextWidth / nextHeight);
      updateEntryExplorationCameraView(
        camera,
        introFloor.getCenter(),
        ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.offset,
        ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.zoom
      );
    };

    const updateRaycasterFromPointerEvent = (event: PointerEvent) => {
      const canvasRect = renderer.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      pointer.y = -(((event.clientY - canvasRect.top) / canvasRect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
    };

    const startIntro = (time: number): boolean => {
      const entryPlaces = placesRef.current;

      if (introStatusRef.current !== "waiting" || !sceneHandlesRef.current?.character) {
        return false;
      }

      if (!entryPlaces) {
        return false;
      }

      editionScenery = createEntryEditionScenery(entryPlaces, (destination) => {
        if (introStatusRef.current !== "ready" || hasActiveSceneInteraction()) return;
        if (onPlacePanelDismissRef.current?.()) return;
        movementRef.current.moveTo({ x: destination.x, z: destination.z });
      });
      surroundings.add(editionScenery.object);
      editionScenery.landmarks.forEach((landmark, placeId) =>
        visitLandmarks.set(placeId, landmark)
      );

      const entryRect = container.getBoundingClientRect();
      const guideDestination = applyLayout(
        Math.max(entryRect.width, 1) / Math.max(entryRect.height, 1)
      );
      const characterStart = movementRef.current.getCurrentPosition();
      const cameraTarget: EntryExplorationScenePoint =
        ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
      introTargetRef.current = cameraTarget;
      const characterDistance = getEntryExplorationSceneDistance(characterStart, cameraTarget);
      const characterTarget = interpolateEntryExplorationScenePoint(
        characterStart,
        cameraTarget,
        characterDistance === 0
          ? 1
          : 1 + ENTRY_EXPLORATION_SCENE_CONFIG.arrivalRadius / characterDistance
      );
      const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;
      const introCenter = introFloor.getCenter();

      if (guideDestination) {
        const guide = createEntryExplorationGuideArrow({
          origin: cameraTarget,
          destination: guideDestination,
          color: getEntryExplorationIntroTheme().guideColor,
        });
        guideArrowRef.current = guide;
        surroundings.add(guide.object);
      }
      introStatusRef.current = "entering";
      introHiddenObjects.forEach((object) => (object.visible = true));
      sceneHandlesRef.current.character.visible = true;
      renderer.domElement.style.cursor = "default";
      renderer.domElement.setAttribute("aria-label", "서울 탐방 공간");
      renderer.domElement.setAttribute("aria-busy", "true");
      renderer.domElement.setAttribute("aria-disabled", "true");
      cameraTransitionRef.current = createSceneCameraTransition({
        camera,
        durationMs: ENTRY_EXPLORATION_SCENE_CONFIG.intro.camera.transitionDurationMs,
        fromLookAt: new THREE.Vector3(introCenter.x, 0, introCenter.z),
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
      onIntroStartRef.current?.();

      return true;
    };

    const requestIntroStart = (): boolean => {
      hasPendingIntroStart = !startIntro(performance.now());

      if (hasPendingIntroStart && !placesRef.current) {
        onIntroBlockedRef.current?.();
      }

      return !hasPendingIntroStart;
    };

    startPendingIntroRef.current = () => {
      if (hasPendingIntroStart) hasPendingIntroStart = !startIntro(performance.now());
    };

    const isPointerOnIntroTitle = (): boolean => {
      const uv = raycaster.intersectObject(introFloor.object, true)[0]?.uv;

      return uv ? isEntryExplorationIntroTitleUv(uv) : false;
    };

    const handlePointerDown = (event: PointerEvent) => {
      updateRaycasterFromPointerEvent(event);

      if (introStatusRef.current === "waiting") {
        if (isPointerOnIntroTitle()) requestIntroStart();
        else track({ name: "entry_intro_miss_click" });
        return;
      }

      if (introStatusRef.current === "entering") {
        return;
      }

      if (!hasActiveSceneInteraction() && onPlacePanelDismissRef.current?.()) {
        movementRef.current.stop();
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

      const approachDestination = getSceneInteractionPointerDestination(raycaster);
      if (approachDestination) {
        Object.values(placeVisitsRef.current ?? {}).forEach((visit) => visit.dismiss());
        movementRef.current.moveTo(approachDestination);
        return;
      }

      const placeDestination = editionScenery?.getPointerDestination(raycaster);
      if (placeDestination) {
        movementRef.current.moveTo(placeDestination);
        return;
      }

      if (hanok && raycaster.intersectObject(hanok, true).length > 0) {
        movementRef.current.moveTo({ x: hanok.position.x, z: hanok.position.z });
        return;
      }

      const floorHit = raycaster.intersectObject(floor)[0];

      if (!floorHit) {
        return;
      }

      Object.values(placeVisitsRef.current ?? {}).forEach((visit) => visit.dismiss());
      movementRef.current.moveTo({
        x: floorHit.point.x,
        z: floorHit.point.z,
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateRaycasterFromPointerEvent(event);

      if (introStatusRef.current === "waiting") {
        renderer.domElement.style.cursor = isPointerOnIntroTitle() ? "pointer" : "default";
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

      if (introStatusRef.current !== "waiting") {
        return;
      }

      event.preventDefault();
      requestIntroStart();
    };

    void loadEntryExplorationGltf(ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST.mesh).then((gltf) => {
      if (disposed) {
        return;
      }

      const model = gltf.scene;

      fitEntryExplorationCharacterModel(model);
      if (characterSpeechAnchor) {
        characterSpeechAnchor.position.y =
          new THREE.Box3().setFromObject(model).max.y / model.scale.y;
        model.add(characterSpeechAnchor);
      }
      model.rotation.y = toCharacterModelRotationRadians(headingRadiansRef.current);
      model.visible = introStatusRef.current !== "waiting";
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

      if (hasPendingIntroStart) startIntro(performance.now());
    });

    const render = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      const characterPosition = movementRef.current.getCurrentPosition();

      lastTime = time;
      mixerRef.current?.update(deltaSeconds);

      if (cameraTransitionRef.current) {
        const transitionResult = updateSceneCameraTransition(cameraTransitionRef.current, time);

        if (transitionResult.done) {
          cameraTransitionRef.current = null;
        }
      }

      if (introStatusRef.current === "ready" && !hasActiveSceneInteraction()) {
        const requestedDestination = takeSceneInteractionCharacterDestination();
        if (requestedDestination) movementRef.current.moveTo(requestedDestination);
        for (const [placeId, landmark] of visitLandmarks) {
          if (placeVisitsRef.current?.[placeId]?.update(characterPosition, landmark.position)) {
            movementRef.current.stop();
          }
        }
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
      guideArrowRef.current?.update(time);
      renderer.render(scene, camera);
      labels.render(scene, camera);
      labels.domElement.hidden = introStatusRef.current !== "ready";
      labels.domElement.style.opacity = renderer.domElement.style.opacity || "1";
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
      cameraTransitionRef.current = null;
      introStatusRef.current = "waiting";
      mixerRef.current = null;
      activeActionsRef.current = [];
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(frameId);
      guideArrowRef.current?.dispose();
      guideArrowRef.current = null;
      startPendingIntroRef.current = null;
      scenery.dispose();
      editionScenery?.dispose();
      labels.domElement.remove();
      archeryRange.dispose();
      disposeEntryExplorationObject3D(introFloor.object);
      disposeEntryExplorationObject3D(floor);
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
    characterSpeechAnchor,
    clearSceneInteractionControllers,
    containerRef,
    createSceneInteractionControllers,
    deactivateActiveInteraction,
    disposeSceneInteractionControllers,
    getSceneInteractionPointerDestination,
    handleSceneInteractionPointerDown,
    handleSceneInteractionPointerMove,
    handleSceneInteractionPointerUp,
    hasActiveSceneInteraction,
    playAnimation,
    releaseInactiveSceneInteraction,
    registerSceneInteractionControllers,
    setSceneInteractionCharacter,
    setSceneInteractionLayout,
    takeSceneInteractionCharacterDestination,
    updateActiveSceneInteractionCamera,
    updateSceneInteractions,
    updateSceneInteractionTriggers,
  ]);
}
