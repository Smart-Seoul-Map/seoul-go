import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { easeInOutCubic, easeOutCubic } from "@shared/lib/animation/easing";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import {
  createEntrySlotSpin,
  getEntrySlotSpinFrame,
  getEntrySlotStopOffset,
  SLOT_STOP_FEEDBACK_MS,
  type EntrySlotSpin,
  type SlotDigits,
  type SlotReelAngles,
} from "../domain/entrySlotSpin";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntrySlotModel } from "./entrySlotModel";
import { createEntrySlotPresentation, getSlotPresentationPoints } from "./entrySlotPresentation";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntrySlotState =
  | { status: "loading" | "closed" | "covering" | "focusing" | "lever" | "spinning" }
  | { status: "result"; result: string; isFallback?: boolean };

export type EntrySlotViewportBounds = { top: number; bottom: number };

export type EntrySlotInteraction = EntryExplorationSceneInteractionController & {
  requestReward: (digits: SlotDigits) => boolean;
  deactivate: () => void;
  prepare: (renderer: THREE.WebGLRenderer) => void;
  setViewportBounds: (bounds: EntrySlotViewportBounds | null) => void;
};

export function createEntrySlotInteraction({
  onStateChange,
}: {
  onStateChange: (state: EntrySlotState) => void;
}): EntrySlotInteraction {
  const object = new THREE.Group();
  object.name = "entry-slot-machine";
  object.visible = false;
  object.position.set(ENTRY_SLOT_CONFIG.position.x, 0, ENTRY_SLOT_CONFIG.position.z);
  const front = new THREE.Vector3(
    Math.cos(ENTRY_SLOT_CONFIG.rotationY),
    0,
    -Math.sin(ENTRY_SLOT_CONFIG.rotationY)
  );
  const presentation = createEntrySlotPresentation(object, front);
  let state: EntrySlotState = { status: "closed" };
  let model: ReturnType<typeof createEntrySlotModel> | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  let requestedDigits: SlotDigits | null = null;
  let loadFailed = false;
  let disposed = false;
  let spinAnimation: EntrySlotSpin | null = null;
  let reducedMotion = false;
  let angles: SlotReelAngles = [0, 0, 0];
  let activatedAt = 0;
  let phaseStartedAt = 0;
  let originalCanvasOpacity = "";
  let modelPoints: readonly THREE.Vector3[] = [];
  let presentationPoints: readonly THREE.Vector3[] = [];
  let viewportBounds: EntrySlotViewportBounds | null = null;

  const setState = (next: EntrySlotState) => {
    state = next;
    onStateChange(next);
  };
  const isActive = () => state.status !== "closed";
  const setCanvasOpacity = (opacity: number) => {
    if (!renderer) return;
    renderer.domElement.style.opacity = String(opacity);
  };
  const restoreCanvasOpacity = () => {
    if (renderer) renderer.domElement.style.opacity = originalCanvasOpacity;
  };
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
      // Framing must not zoom in and out as the lever moves.
      modelPoints = getSlotPresentationPoints(object);
      prepareEnvironment();
    } catch {
      loadFailed = true;
    }
  };
  void load();

  const spin = (time: number) => {
    if (!model || !requestedDigits) return;
    spinAnimation = createEntrySlotSpin({
      digits: requestedDigits,
      from: angles,
      startedAt: time,
    });
    phaseStartedAt = time;
    setState({ status: "spinning" });
  };
  const showFallback = () => {
    if (!requestedDigits) return;
    spinAnimation = null;
    object.visible = false;
    model?.setLeverAngle(0);
    model?.setStopFeedback(0);
    restoreCanvasOpacity();
    setState({ status: "result", result: requestedDigits.join(""), isFallback: true });
  };
  const beginFocus = (time: number) => {
    phaseStartedAt = time;
    object.visible = true;
    model?.setLeverAngle(0);
    model?.setStopFeedback(0);
    presentationPoints = presentation.show(modelPoints);
    setState({ status: "focusing" });
  };
  const deactivate = () => {
    if (state.status !== "result") return;
    spinAnimation = null;
    requestedDigits = null;
    object.visible = false;
    model?.setLeverAngle(0);
    model?.setStopFeedback(0);
    restoreCanvasOpacity();
    presentation.restore();
    setState({ status: "closed" });
  };

  return {
    object,
    requestReward(digits) {
      if (disposed || requestedDigits || isActive()) return false;
      requestedDigits = digits;
      return true;
    },
    priority: 20,
    isActive,
    canActivate: () => Boolean(requestedDigits && !isActive()),
    activate(time) {
      if (!requestedDigits || isActive()) return;
      reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      activatedAt = time;
      phaseStartedAt = time;
      setState({ status: "covering" });
    },
    deactivate,
    handlePointerDown: () => isActive(),
    handlePointerMove: () => isActive(),
    handlePointerUp: () => isActive(),
    setCharacter: presentation.setCharacter,
    setSurroundings: presentation.setSurroundings,
    prepare(value) {
      renderer = value;
      originalCanvasOpacity = renderer.domElement.style.opacity;
      prepareEnvironment();
    },
    setViewportBounds(bounds) {
      viewportBounds = bounds;
    },
    update(time) {
      const elapsed = time - phaseStartedAt;
      const { presentation, lever } = ENTRY_SLOT_CONFIG;
      if (state.status === "covering") {
        setCanvasOpacity(1 - easeInOutCubic(elapsed / presentation.coverMs));
        if (elapsed < presentation.coverMs) return;
        if (loadFailed) showFallback();
        else if (model) beginFocus(time);
        else setState({ status: "loading" });
        return;
      }
      if (state.status === "loading") {
        if (loadFailed || time - activatedAt >= ENTRY_SLOT_CONFIG.loadTimeoutMs) showFallback();
        else if (model) beginFocus(time);
        return;
      }
      if (state.status === "focusing") {
        setCanvasOpacity(easeInOutCubic(elapsed / presentation.revealMs));
        if (elapsed >= presentation.revealMs) {
          restoreCanvasOpacity();
          phaseStartedAt = time;
          setState({ status: "lever" });
        }
        return;
      }
      if (state.status === "lever") {
        model?.setLeverAngle(lever.pullAngle * easeOutCubic(elapsed / lever.pullMs));
        if (elapsed >= lever.pullMs + lever.holdMs) spin(time);
        return;
      }
      if (!spinAnimation || !model) return;
      try {
        model.setLeverAngle(lever.pullAngle * (1 - easeInOutCubic(elapsed / lever.returnMs)));
        const frame = getEntrySlotSpinFrame(spinAnimation, time);
        angles = frame.angles;
        model.setAngles(angles);
        model.setStopFeedback(reducedMotion ? 0 : getEntrySlotStopOffset(spinAnimation, time));
        if (state.status === "spinning" && frame.done && frame.result !== null) {
          setState({ status: "result", result: frame.result });
        }
        const stoppedAt = Math.max(...spinAnimation.reels.map((reel) => reel.durationMs));
        if (elapsed >= stoppedAt + SLOT_STOP_FEEDBACK_MS) spinAnimation = null;
      } catch {
        showFallback();
      }
    },
    updateCamera(camera) {
      if (
        !isActive() ||
        !model ||
        presentationPoints.length === 0 ||
        state.status === "covering" ||
        state.status === "loading" ||
        (state.status === "result" && state.isFallback)
      )
        return;
      // Switch directly to the front while the canvas is covered, then fade it in.
      const view = getSlotCameraView(camera, presentationPoints, front, viewportBounds);
      camera.position.copy(view.position);
      camera.zoom = view.zoom;
      camera.lookAt(view.focus);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    },
    updateTriggerState() {},
    dispose() {
      if (disposed) return;
      disposed = true;
      spinAnimation = null;
      restoreCanvasOpacity();
      presentation.restore();
      model?.dispose();
      environment?.dispose();
      object.clear();
    },
  };
}

function getSlotCameraView(
  camera: THREE.OrthographicCamera,
  points: readonly THREE.Vector3[],
  front: THREE.Vector3,
  viewportBounds: EntrySlotViewportBounds | null
) {
  const offset = front.clone().multiplyScalar(ENTRY_SLOT_CONFIG.camera.distance);
  offset.y = ENTRY_SLOT_CONFIG.camera.elevation;
  const forward = offset.clone().normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
  const up = forward.clone().cross(right);
  // Fit each model in camera space so a diagonal world-space box does not add empty space.
  const projected = new THREE.Box3();
  points.forEach((point) => {
    projected.expandByPoint(new THREE.Vector3(point.dot(right), point.dot(up), point.dot(forward)));
  });
  const size = projected.getSize(new THREE.Vector3());
  const center = projected.getCenter(new THREE.Vector3());
  const focus = right
    .clone()
    .multiplyScalar(center.x)
    .addScaledVector(up, center.y)
    .addScaledVector(forward, center.z);
  const { top, bottom } = viewportBounds ?? { top: 0, bottom: 1 };
  const availableHeight = bottom - top;
  const gap = availableHeight * ENTRY_SLOT_CONFIG.camera.viewportGapRatio;
  const heightUsage = Math.min(ENTRY_SLOT_CONFIG.camera.heightUsage, availableHeight - gap * 2);
  const zoom = Math.min(
    ((camera.right - camera.left) * ENTRY_SLOT_CONFIG.camera.widthUsage) / size.x,
    ((camera.top - camera.bottom) * heightUsage) / size.y
  );
  const contentCenterY = THREE.MathUtils.clamp(
    ENTRY_SLOT_CONFIG.camera.contentCenterY,
    top + gap + heightUsage / 2,
    bottom - gap - heightUsage / 2
  );
  focus.addScaledVector(up, -((0.5 - contentCenterY) * (camera.top - camera.bottom)) / zoom);
  // Keep the lowest orthographic ray above the floor, including tall mobile viewports.
  const lowestRayHeight = focus.y + offset.y + (camera.bottom / zoom) * up.y;
  if (lowestRayHeight < camera.near)
    offset.multiplyScalar(1 + (camera.near - lowestRayHeight) / offset.y);

  return {
    focus,
    zoom,
    position: focus.clone().add(offset),
  };
}
