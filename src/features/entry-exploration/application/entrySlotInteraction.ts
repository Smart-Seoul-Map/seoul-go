import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import {
  createEntrySlotSpin,
  getEntrySlotSpinFrame,
  pickSlotDigits,
  type EntrySlotSpin,
  type SlotDigits,
  type SlotReelAngles,
} from "../domain/entrySlotSpin";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntrySlotModel } from "./entrySlotModel";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntrySlotState =
  | { status: "loading" | "closed" | "focusing" | "ready" | "spinning" | "error" }
  | { status: "result"; result: string };

export type EntrySlotViewportBounds = { top: number; bottom: number };

export type EntrySlotInteraction = EntryExplorationSceneInteractionController & {
  deactivate: () => void;
  getActivationCharacterDestination: () => EntryExplorationScenePoint;
  getPointerDestination: (raycaster: THREE.Raycaster) => EntryExplorationScenePoint | null;
  prepare: (renderer: THREE.WebGLRenderer) => void;
  retryLoad: () => void;
  setViewportBounds: (bounds: EntrySlotViewportBounds | null) => void;
  spin: (time: number, digits?: SlotDigits) => boolean;
};

export function createEntrySlotInteraction({
  onStateChange,
}: {
  onStateChange: (state: EntrySlotState) => void;
}): EntrySlotInteraction {
  const object = new THREE.Group();
  object.name = "entry-slot-machine";
  object.position.set(ENTRY_SLOT_CONFIG.position.x, 0, ENTRY_SLOT_CONFIG.position.z);
  const front = new THREE.Vector3(
    Math.cos(ENTRY_SLOT_CONFIG.rotationY),
    0,
    -Math.sin(ENTRY_SLOT_CONFIG.rotationY)
  );
  let state: EntrySlotState = { status: "loading" };
  let model: ReturnType<typeof createEntrySlotModel> | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  let character: THREE.Object3D | null = null;
  let characterWasVisible = true;
  let isInside = false;
  let waitsForExit = false;
  let disposed = false;
  let spinAnimation: EntrySlotSpin | null = null;
  let angles: SlotReelAngles = [0, 0, 0];
  let transition: SceneCameraTransition | null = null;
  let activatedAt = 0;
  let viewportBounds: EntrySlotViewportBounds | null = null;

  const setState = (next: EntrySlotState) => {
    state = next;
    onStateChange(next);
  };
  const isActive = () => ["focusing", "ready", "spinning", "result"].includes(state.status);
  const getActivationCharacterDestination = () => ({
    x: object.position.x + front.x * ENTRY_SLOT_CONFIG.approachOffset,
    z: object.position.z + front.z * ENTRY_SLOT_CONFIG.approachOffset,
  });
  const prepareEnvironment = () => {
    if (!renderer || !model || environment) return;
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    environment = generator.fromScene(room);
    model.setEnvironment(environment.texture);
    room.dispose();
    generator.dispose();
  };
  const load = async () => {
    try {
      const gltf = await loadEntryExplorationGltf(ENTRY_SLOT_CONFIG.modelUrl);
      if (disposed) return;
      model = createEntrySlotModel(gltf.scene);
      object.add(model.object);
      object.updateMatrixWorld(true);
      prepareEnvironment();
      setState({ status: "closed" });
    } catch {
      if (!disposed) setState({ status: "error" });
    }
  };
  void load();

  const spin = (time: number, digits?: SlotDigits): boolean => {
    if (!model || (state.status !== "ready" && state.status !== "result")) return false;
    spinAnimation = createEntrySlotSpin({
      digits: digits ?? pickSlotDigits(),
      from: angles,
      startedAt: time,
    });
    setState({ status: "spinning" });

    return true;
  };
  const deactivate = () => {
    if (!isActive()) return;
    spinAnimation = null;
    transition = null;
    waitsForExit = true;
    model?.setSelectionVisible(false);
    if (character) character.visible = characterWasVisible;
    setState({ status: "closed" });
  };
  const hitsModel = (raycaster: THREE.Raycaster) =>
    Boolean(
      model &&
      raycaster.intersectObject(model.object, true).some((hit) => hit.object instanceof THREE.Mesh)
    );

  return {
    object,
    priority: 20,
    isActive,
    canActivate: () => Boolean(model && state.status === "closed" && isInside && !waitsForExit),
    activate(time) {
      if (!model || !isInside || isActive() || waitsForExit) return;
      activatedAt = time;
      transition = null;
      if (character) {
        characterWasVisible = character.visible;
        character.visible = false;
      }
      model.setSelectionVisible(true);
      setState({ status: "focusing" });
    },
    deactivate,
    getActivationCharacterDestination,
    getPointerDestination(raycaster) {
      if (isActive() || !hitsModel(raycaster)) return null;
      waitsForExit = false;

      return getActivationCharacterDestination();
    },
    handlePointerDown(raycaster, time) {
      if (!isActive()) return false;
      if (hitsModel(raycaster)) spin(time);

      return true;
    },
    handlePointerMove: () => isActive(),
    handlePointerUp: () => isActive(),
    setCharacter(value) {
      character = value;
    },
    prepare(value) {
      renderer = value;
      prepareEnvironment();
    },
    retryLoad() {
      if (disposed || state.status !== "error") return;
      setState({ status: "loading" });
      void load();
    },
    spin,
    setViewportBounds(bounds) {
      viewportBounds = bounds;
    },
    update(time) {
      if (!spinAnimation || !model) return;
      const frame = getEntrySlotSpinFrame(spinAnimation, time);
      angles = frame.angles;
      model.setAngles(angles);
      if (frame.done && frame.result !== null) {
        spinAnimation = null;
        setState({ status: "result", result: frame.result });
      }
    },
    updateCamera(camera, time) {
      if (!isActive()) return;
      const view = getSlotCameraView(camera, object, front, viewportBounds);
      if (state.status !== "focusing") {
        camera.position.copy(view.position);
        camera.zoom = view.zoom;
        camera.lookAt(view.focus);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        return;
      }
      transition ??= createSceneCameraTransition({
        camera,
        durationMs: ENTRY_SLOT_CONFIG.camera.transitionMs,
        now: activatedAt,
        toLookAt: view.focus,
        toPosition: view.position,
        toZoom: view.zoom,
      });
      if (updateSceneCameraTransition(transition, time).done) {
        transition = null;
        setState({ status: "ready" });
      }
    },
    updateTriggerState(position) {
      isInside = isInsideSceneTriggerRadius({
        position,
        triggerPoint: getActivationCharacterDestination(),
        radius: ENTRY_SLOT_CONFIG.triggerRadius,
      });
      if (!isInside) waitsForExit = false;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      spinAnimation = null;
      transition = null;
      if (character && isActive()) character.visible = characterWasVisible;
      model?.dispose();
      environment?.dispose();
      object.clear();
    },
  };
}

function getSlotCameraView(
  camera: THREE.OrthographicCamera,
  object: THREE.Object3D,
  front: THREE.Vector3,
  viewportBounds: EntrySlotViewportBounds | null
) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const focus = bounds.getCenter(new THREE.Vector3());
  const width = size.x * Math.abs(front.z) + size.z * Math.abs(front.x);
  const { top, bottom } = viewportBounds ?? { top: 0, bottom: 1 };
  const availableHeight = bottom - top;
  const gap = availableHeight * ENTRY_SLOT_CONFIG.camera.viewportGapRatio;
  const heightUsage = Math.min(ENTRY_SLOT_CONFIG.camera.heightUsage, availableHeight - gap * 2);
  const zoom = Math.min(
    ((camera.right - camera.left) * ENTRY_SLOT_CONFIG.camera.widthUsage) / width,
    ((camera.top - camera.bottom) * heightUsage) / size.y
  );
  const contentCenterY = THREE.MathUtils.clamp(
    ENTRY_SLOT_CONFIG.camera.contentCenterY,
    top + gap + heightUsage / 2,
    bottom - gap - heightUsage / 2
  );
  focus.y -= ((0.5 - contentCenterY) * (camera.top - camera.bottom)) / zoom;

  return {
    focus,
    zoom,
    position: focus.clone().addScaledVector(front, ENTRY_SLOT_CONFIG.camera.distance),
  };
}
