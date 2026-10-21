import * as THREE from "three";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";
import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntrySlotInteraction } from "./entrySlotInteraction";

vi.mock("./entryExplorationGltfLoader", () => ({ loadEntryExplorationGltf: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

const FRONT = new THREE.Vector3(
  Math.cos(ENTRY_SLOT_CONFIG.rotationY),
  0,
  -Math.sin(ENTRY_SLOT_CONFIG.rotationY)
);
const DOWN = new THREE.Vector3(0, -1, 0);
const SLOT_POSITION = ENTRY_INTRO_LAYOUTS.pc.objects["slot-machine"];

function toApproachPoint({ x, z }: EntryExplorationScenePoint): EntryExplorationScenePoint {
  return {
    x: x + FRONT.x * ENTRY_SLOT_CONFIG.approachOffset,
    z: z + FRONT.z * ENTRY_SLOT_CONFIG.approachOffset,
  };
}

const APPROACH_POINT = toApproachPoint(SLOT_POSITION);
const AWAY = { x: 100, z: 100 };
const SPIN_STARTED_AT = ENTRY_SLOT_CONFIG.lever.pullMs + ENTRY_SLOT_CONFIG.lever.holdMs;

function sourceModel() {
  const scene = new THREE.Group();
  for (const name of ["slot", "slot_lever", ...ENTRY_SLOT_CONFIG.reelNames]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshStandardMaterial());
    mesh.name = name;
    mesh.rotation.z = -Math.PI / 2;
    scene.add(mesh);
  }
  return {
    scene,
    animations: [],
    scenes: [scene],
    cameras: [],
    asset: { version: "2.0" },
    parser: {} as never,
    userData: {},
  };
}

async function setup() {
  vi.mocked(loadEntryExplorationGltf).mockResolvedValue(sourceModel());
  const controller = createEntrySlotInteraction();
  await vi.waitFor(() => expect(controller.object.getObjectByName("slot")).toBeTruthy());
  return controller;
}

function arrive(controller: ReturnType<typeof createEntrySlotInteraction>, time: number) {
  controller.updateTriggerState(AWAY);
  controller.updateTriggerState(APPROACH_POINT);
  controller.update(time);
}

describe("intro slot machine", () => {
  test("stands at its layout point and sends a click on it to the front of the machine", async () => {
    const controller = await setup();
    controller.object.updateMatrixWorld(true);
    const { x, z } = SLOT_POSITION;

    expect(controller.object.visible).toBe(true);
    expect(controller.object.position.x).toBe(x);
    expect(controller.object.position.z).toBe(z);
    expect(
      controller.getPointerDestination?.(new THREE.Raycaster(new THREE.Vector3(x, 20, z), DOWN))
    ).toEqual(APPROACH_POINT);
    expect(
      controller.getPointerDestination?.(
        new THREE.Raycaster(new THREE.Vector3(x + 50, 20, z), DOWN)
      )
    ).toBeNull();
    controller.dispose();
  });

  test("moves to the slot point of the active intro layout", async () => {
    const controller = await setup();
    const mobile = ENTRY_INTRO_LAYOUTS.mobile.objects["slot-machine"];

    controller.setLayout?.(ENTRY_INTRO_LAYOUTS.mobile);
    controller.object.updateMatrixWorld(true);

    expect(controller.object.position.x).toBe(mobile.x);
    expect(controller.object.position.z).toBe(mobile.z);
    expect(
      controller.getPointerDestination?.(
        new THREE.Raycaster(new THREE.Vector3(mobile.x, 20, mobile.z), DOWN)
      )
    ).toEqual(toApproachPoint(mobile));
    controller.dispose();
  });

  test.each([false, true])(
    "pulls the lever and spins in place on arrival without taking over the scene (reduced motion: %s)",
    async (reduced) => {
      vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
      const controller = await setup();
      const lever = controller.object.getObjectByName("slot_lever")!;
      const reel = controller.object.getObjectByName(ENTRY_SLOT_CONFIG.reelNames[0])!;
      const machine = controller.object.children[0];
      const leverBefore = lever.quaternion.clone();
      const reelBefore = reel.quaternion.clone();

      arrive(controller, 0);
      controller.update(ENTRY_SLOT_CONFIG.lever.pullMs);
      expect(lever.quaternion.equals(leverBefore)).toBe(false);
      expect(reel.quaternion.equals(reelBefore)).toBe(true);

      controller.update(SPIN_STARTED_AT);
      controller.update(SPIN_STARTED_AT + 800);
      expect(reel.quaternion.equals(reelBefore)).toBe(false);
      expect(controller.canActivate()).toBe(false);
      expect(controller.isActive()).toBe(false);

      controller.update(SPIN_STARTED_AT + 1600 + 22.5);
      expect(machine.position.z === 0).toBe(reduced);

      controller.update(SPIN_STARTED_AT + 2000 + 200);
      expect(machine.position.z).toBe(0);
      expect(lever.quaternion.angleTo(leverBefore)).toBeCloseTo(0);
      controller.dispose();
    }
  );

  test("spins again only after the character leaves and comes back", async () => {
    const controller = await setup();
    const lever = controller.object.getObjectByName("slot_lever")!;
    const leverBefore = lever.quaternion.clone();
    const finishedAt = SPIN_STARTED_AT + 2000 + 200;

    arrive(controller, 0);
    controller.update(SPIN_STARTED_AT);
    controller.update(finishedAt);

    controller.updateTriggerState(APPROACH_POINT);
    controller.update(finishedAt + 10);
    controller.update(finishedAt + 200);
    expect(lever.quaternion.angleTo(leverBefore)).toBeCloseTo(0);

    arrive(controller, finishedAt + 300);
    controller.update(finishedAt + 500);
    expect(lever.quaternion.angleTo(leverBefore)).toBeGreaterThan(0.1);
    controller.dispose();
  });
});
