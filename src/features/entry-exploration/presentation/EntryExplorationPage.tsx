import { useCallback, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import * as THREE from "three";

import {
  playCharacterAnimationClips,
  stopCharacterAnimationActions,
} from "@shared/lib/character/characterAnimationPlayer";
import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import type { CharacterMovementModelKey } from "@shared/lib/character/useCharacterMovementController";
import { useCharacterMovementController } from "@shared/lib/character/useCharacterMovementController";

import { loadEntryExplorationGltf } from "../application/entryExplorationGltfLoader";
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
} from "../application/entryExplorationThreeScene";
import { useEntryExplorationInteraction } from "../application/useEntryExplorationInteraction";
import {
  ENTRY_EXPLORATION_CHARACTER_ANIMATION_TIME_SCALE,
  ENTRY_EXPLORATION_CHARACTER_MODEL_MANIFEST,
  ENTRY_EXPLORATION_SCENE_CONFIG,
} from "../config/entryExplorationSceneConfig";
import { ENTRY_EXPLORATION_SCENE_OBJECTS } from "../config/entryExplorationSceneObjects";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  interpolateEntryExplorationScenePoint,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";
import { SubwaySelectionModal } from "./SubwaySelectionModal";

type SceneHandles = {
  camera: THREE.OrthographicCamera;
  character: THREE.Object3D | null;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
};

export function EntryExplorationPage(): ReactElement {
  const activeActionsRef = useRef<THREE.AnimationAction[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentModelKeyRef = useRef<CharacterMovementModelKey>("idlePrimary");
  const headingRadiansRef = useRef(0);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const sceneHandlesRef = useRef<SceneHandles | null>(null);
  const interaction = useEntryExplorationInteraction();

  const applyScenePosition = useCallback((position: EntryExplorationScenePoint) => {
    const handles = sceneHandlesRef.current;

    if (!handles) {
      return;
    }

    handles.character?.position.set(position.x, 0, position.z);
    updateEntryExplorationCameraFocus(handles.camera, position);
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
    if (!interaction.activeInteractionType) {
      return;
    }

    movement.stop();
  }, [interaction.activeInteractionType, movement.stop]);

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
    updateEntryExplorationCameraFocus(camera, { x: 0, z: 0 });
    sceneHandlesRef.current = { camera, character: null, renderer, scene };

    const resize = () => {
      const nextRect = container.getBoundingClientRect();
      const nextWidth = Math.max(nextRect.width, 1);
      const nextHeight = Math.max(nextRect.height, 1);

      resizeEntryExplorationCamera(camera, nextWidth, nextHeight);
      renderer.setSize(nextWidth, nextHeight, false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (interaction.getHasActiveInteraction()) {
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

      lastTime = time;
      mixerRef.current?.update(deltaSeconds);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    frameId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      sceneHandlesRef.current = null;
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
        <SubwaySelectionModal onClose={interaction.closeInteraction} />
      ) : null}
    </main>
  );
}
