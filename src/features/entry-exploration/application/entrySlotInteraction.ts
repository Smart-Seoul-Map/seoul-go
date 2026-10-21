import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { easeInOutCubic, easeOutCubic } from "@shared/lib/animation/easing";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import { ENTRY_INTRO_LAYOUTS, type EntryIntroLayout } from "../config/entryIntroLayout";
import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import { resolveEntryIntroLayoutView } from "../domain/entryIntroLayout";
import {
  createEntrySlotSpin,
  getEntrySlotSpinFrame,
  getEntrySlotStopOffset,
  pickSlotDigits,
  SLOT_STOP_FEEDBACK_MS,
  type EntrySlotSpin,
  type SlotReelAngles,
} from "../domain/entrySlotSpin";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntrySlotModel } from "./entrySlotModel";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

export type EntrySlotInteraction = EntryExplorationSceneInteractionController & {
  prepare: (renderer: THREE.WebGLRenderer) => void;
};

export function createEntrySlotInteraction(): EntrySlotInteraction {
  const object = new THREE.Group();
  object.name = "entry-slot-machine";
  const front = new THREE.Vector3(
    Math.cos(ENTRY_SLOT_CONFIG.rotationY),
    0,
    -Math.sin(ENTRY_SLOT_CONFIG.rotationY)
  );
  let approachPoint: EntryExplorationScenePoint;
  let model: ReturnType<typeof createEntrySlotModel> | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  let disposed = false;
  let isCharacterInside = false;
  let isSpinRequested = false;
  let leverPulledAt: number | null = null;
  let spinAnimation: EntrySlotSpin | null = null;
  let angles: SlotReelAngles = [0, 0, 0];
  let reducedMotion = false;

  const setLayout = (layout: EntryIntroLayout): void => {
    const { x, z } = layout.objects["slot-machine"];
    object.position.set(x, 0, z);
    approachPoint = {
      x: x + front.x * ENTRY_SLOT_CONFIG.approachOffset,
      z: z + front.z * ENTRY_SLOT_CONFIG.approachOffset,
    };
  };

  setLayout(resolveEntryIntroLayoutView(ENTRY_INTRO_LAYOUTS, "pc"));

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
    const gltf = await loadEntryExplorationGltf(ENTRY_SLOT_CONFIG.modelUrl);
    if (disposed) return;
    model = createEntrySlotModel(gltf.scene);
    object.add(model.object);
    prepareEnvironment();
  };
  void load().catch(() => undefined);

  const pullLever = (time: number) => {
    if (!model || leverPulledAt !== null || spinAnimation) return;
    reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    leverPulledAt = time;
  };

  return {
    object,
    activate() {},
    canActivate: () => false,
    isActive: () => false,
    getPointerDestination: (raycaster) =>
      raycaster.intersectObject(object, true).length > 0 ? approachPoint : null,
    handlePointerDown: () => false,
    handlePointerMove: () => false,
    handlePointerUp: () => false,
    setLayout,
    prepare(value) {
      renderer = value;
      prepareEnvironment();
    },
    update(time) {
      if (isSpinRequested) {
        isSpinRequested = false;
        pullLever(time);
      }
      if (!model) return;
      const { lever } = ENTRY_SLOT_CONFIG;
      if (leverPulledAt !== null) {
        const elapsed = time - leverPulledAt;
        model.setLeverAngle(lever.pullAngle * easeOutCubic(elapsed / lever.pullMs));
        if (elapsed < lever.pullMs + lever.holdMs) return;
        leverPulledAt = null;
        spinAnimation = createEntrySlotSpin({
          digits: pickSlotDigits(),
          from: angles,
          startedAt: time,
        });
      }
      if (!spinAnimation) return;
      const elapsed = time - spinAnimation.startedAt;
      model.setLeverAngle(lever.pullAngle * (1 - easeInOutCubic(elapsed / lever.returnMs)));
      angles = getEntrySlotSpinFrame(spinAnimation, time).angles;
      model.setAngles(angles);
      model.setStopFeedback(reducedMotion ? 0 : getEntrySlotStopOffset(spinAnimation, time));
      const stoppedAt = Math.max(...spinAnimation.reels.map((reel) => reel.durationMs));
      if (elapsed >= stoppedAt + SLOT_STOP_FEEDBACK_MS) {
        spinAnimation = null;
        model.setStopFeedback(0);
      }
    },
    updateCamera() {},
    updateTriggerState(position) {
      const isInside = isInsideSceneTriggerRadius({
        position,
        radius: ENTRY_SLOT_CONFIG.triggerRadius,
        triggerPoint: approachPoint,
      });
      if (isInside && !isCharacterInside) isSpinRequested = true;
      isCharacterInside = isInside;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      spinAnimation = null;
      model?.dispose();
      environment?.dispose();
      object.clear();
    },
  };
}
