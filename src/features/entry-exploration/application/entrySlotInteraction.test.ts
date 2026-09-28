import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntrySlotInteraction, type EntrySlotState } from "./entrySlotInteraction";

vi.mock("./entryExplorationGltfLoader", () => ({ loadEntryExplorationGltf: vi.fn() }));

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
  let state: EntrySlotState = { status: "closed" };
  const controller = createEntrySlotInteraction({
    onStateChange: (next) => {
      state = next;
    },
  });
  await vi.waitFor(() => expect(controller.object.getObjectByName("slot")).toBeTruthy());
  return { controller, state: () => state };
}

function focus(controller: ReturnType<typeof createEntrySlotInteraction>) {
  controller.requestReward([4, 0]);
  controller.activate(0);
  const camera = new THREE.OrthographicCamera(-12, 12, 9.5, -9.5, 0.1, 1000);
  camera.position.set(14, 13, 14);
  controller.updateCamera(camera, 0, { x: 20, z: 30 });
  controller.update(240);
  controller.updateCamera(camera, 240, { x: 20, z: 30 });
  controller.update(600);
  return camera;
}

describe("reward slot interaction", () => {
  test.each(["fallback", "dispose"] as const)(
    "restores the canvas opacity after %s interrupts a covered loading screen",
    (completion) => {
      vi.mocked(loadEntryExplorationGltf).mockReturnValueOnce(new Promise(() => {}));
      const canvas = document.createElement("canvas");
      const controller = createEntrySlotInteraction({ onStateChange: () => {} });
      controller.prepare({ domElement: canvas } as unknown as THREE.WebGLRenderer);
      controller.requestReward([4, 0]);
      controller.activate(0);
      controller.update(120);
      expect(Number(canvas.style.opacity)).toBeCloseTo(0.5);
      controller.update(240);
      expect(canvas.style.opacity).toBe("0");
      if (completion === "fallback") controller.update(10001);
      else controller.dispose();
      expect(canvas.style.opacity).toBe("");
      controller.dispose();
    }
  );
  test("proximity never grants a spin; a reward request works away from the model", async () => {
    const { controller, state } = await setup();
    controller.updateTriggerState(ENTRY_SLOT_CONFIG.position);
    expect(controller.canActivate()).toBe(false);
    controller.activate(0);
    expect(state().status).toBe("closed");
    controller.updateTriggerState({ x: 100, z: 100 });
    controller.requestReward([4, 0]);
    expect(controller.canActivate()).toBe(true);
    expect(controller.getActivationCharacterDestination).toBeUndefined();
    controller.dispose();
  });

  test("reveals the front view, pulls the lever before the reels, and stops after two seconds", async () => {
    const { controller, state } = await setup();
    const body = controller.object.getObjectByName("slot")!;
    const lever = controller.object.getObjectByName("slot_lever")!;
    const before = [body.quaternion.clone(), lever.quaternion.clone()];
    focus(controller);
    expect(state().status).toBe("lever");
    controller.update(800);
    expect(lever.quaternion.equals(before[1])).toBe(false);
    for (const name of ENTRY_SLOT_CONFIG.reelNames)
      expect(controller.object.getObjectByName(name)?.rotation.z).toBeCloseTo(-Math.PI / 2);
    controller.deactivate();
    expect(state().status).toBe("lever");
    controller.update(1050);
    expect(state().status).toBe("spinning");
    expect(controller.requestReward([6, 5])).toBe(false);
    controller.update(1500);
    for (const name of ENTRY_SLOT_CONFIG.reelNames)
      expect(controller.object.getObjectByName(name)?.rotation.z).not.toBeCloseTo(-Math.PI / 2);
    expect(body.quaternion.equals(before[0])).toBe(true);
    expect(lever.quaternion.equals(before[1])).toBe(true);
    controller.update(3049);
    expect(state().status).toBe("spinning");
    controller.update(3050);
    expect(state()).toEqual({ status: "result", result: "40" });
    for (const [name, expectedDegrees] of [
      ["slot_number_2", 144],
      ["slot_number_1", 0],
    ] as const) {
      const angle = controller.object.getObjectByName(name)!.rotation.z;
      expect(Math.cos(angle)).toBeCloseTo(Math.cos((expectedDegrees * Math.PI) / 180));
      expect(Math.sin(angle)).toBeCloseTo(Math.sin((expectedDegrees * Math.PI) / 180));
    }
    expect(controller.requestReward([6, 5])).toBe(false);
    controller.dispose();
  });

  test("blocks closing until the result and restores the unchanged character position and visibility", async () => {
    const { controller, state } = await setup();
    const character = new THREE.Group();
    character.position.set(20, 0, 30);
    controller.setCharacter?.(character);
    controller.requestReward([4, 0]);
    controller.activate(0);
    controller.deactivate();
    expect(state().status).toBe("covering");
    expect(character.visible).toBe(false);
    const camera = new THREE.OrthographicCamera(-12, 12, 9.5, -9.5, 0.1, 1000);
    controller.updateCamera(camera, 0, { x: 20, z: 30 });
    controller.update(240);
    controller.updateCamera(camera, 240, { x: 20, z: 30 });
    controller.update(600);
    controller.update(1050);
    controller.deactivate();
    expect(state().status).toBe("spinning");
    controller.update(4000);
    controller.deactivate();
    expect(state().status).toBe("closed");
    expect(character.visible).toBe(true);
    expect(character.position.toArray()).toEqual([20, 0, 30]);
    expect(controller.canActivate()).toBe(false);
    controller.dispose();
  });

  test("is invisible and not clickable in the intro and hides again after the reward", async () => {
    const { controller, state } = await setup();
    expect(controller.object.visible).toBe(false);
    controller.object.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(controller.object).getCenter(new THREE.Vector3());
    const origin = center.clone().add(new THREE.Vector3(10, 0, 10));
    const ray = new THREE.Raycaster(origin, center.clone().sub(origin).normalize());
    expect(controller.handlePointerDown(ray, 0)).toBe(false);
    expect(state().status).toBe("closed");
    focus(controller);
    expect(controller.object.visible).toBe(true);
    controller.update(1050);
    controller.update(4000);
    controller.handlePointerDown(ray, 5000);
    expect(state().status).toBe("result");
    controller.deactivate();
    expect(controller.object.visible).toBe(false);
    expect(controller.handlePointerDown(ray, 6000)).toBe(false);
    controller.dispose();
  });

  test("does not fly the camera from the visited place and keeps framing stable during lever motion", async () => {
    const { controller } = await setup();
    const camera = new THREE.OrthographicCamera(-12, 12, 9.5, -9.5, 0.1, 1000);
    camera.position.set(100, 20, 100);
    const originalPosition = camera.position.clone();
    controller.requestReward([4, 0]);
    controller.activate(0);
    controller.update(120);
    controller.updateCamera(camera, 120, { x: 100, z: 100 });
    expect(camera.position.equals(originalPosition)).toBe(true);
    expect(controller.object.visible).toBe(false);
    controller.update(240);
    controller.updateCamera(camera, 240, { x: 100, z: 100 });
    const front = camera.position.clone();
    const zoom = camera.zoom;
    expect(front.equals(originalPosition)).toBe(false);
    controller.update(600);
    controller.update(800);
    controller.updateCamera(camera, 800, { x: 100, z: 100 });
    expect(camera.position.equals(front)).toBe(true);
    expect(camera.zoom).toBe(zoom);
    controller.dispose();
  });

  test("keeps the model inside a narrow camera after resize", async () => {
    const { controller } = await setup();
    const camera = focus(controller);
    camera.left = -3.6;
    camera.right = 3.6;
    controller.updateCamera(camera, 2000, { x: 20, z: 30 });
    const bounds = new THREE.Box3().setFromObject(controller.object);
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const projected = new THREE.Vector3(x, y, z).project(camera);
          expect(Math.abs(projected.x)).toBeLessThan(1);
          expect(projected.y).toBeGreaterThan(-0.6);
          expect(projected.y).toBeLessThan(1);
        }
    controller.dispose();
  });

  test("frames the model between the header and controls on a short viewport", async () => {
    const { controller } = await setup();
    const camera = focus(controller);
    controller.setViewportBounds({ top: 56 / 320, bottom: 220 / 320 });
    controller.updateCamera(camera, 2000, { x: 20, z: 30 });
    const bounds = new THREE.Box3().setFromObject(controller.object);
    for (const y of [bounds.min.y, bounds.max.y]) {
      const projected = new THREE.Vector3(bounds.min.x, y, bounds.min.z).project(camera);
      const screenY = ((1 - projected.y) / 2) * 320;
      expect(screenY).toBeGreaterThan(56);
      expect(screenY).toBeLessThan(220);
    }
    controller.dispose();
  });

  test("shows the assigned number as a closable fallback when loading fails", async () => {
    vi.mocked(loadEntryExplorationGltf).mockRejectedValueOnce(new Error("offline"));
    let state: EntrySlotState = { status: "closed" };
    const controller = createEntrySlotInteraction({
      onStateChange: (next) => {
        state = next;
      },
    });
    controller.requestReward([5, 7]);
    controller.activate(0);
    await Promise.resolve();
    controller.update(240);
    expect(state).toEqual({ status: "result", result: "57", isFallback: true });
    controller.deactivate();
    expect(state.status).toBe("closed");
    controller.dispose();
  });

  test("a stalled load cannot lock the user forever or overwrite its fallback on late completion", async () => {
    let resolve!: (value: ReturnType<typeof sourceModel>) => void;
    vi.mocked(loadEntryExplorationGltf).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    let state: EntrySlotState = { status: "closed" };
    const controller = createEntrySlotInteraction({
      onStateChange: (next) => {
        state = next;
      },
    });
    controller.requestReward([6, 5]);
    controller.activate(0);
    controller.update(240);
    controller.deactivate();
    expect(state.status).toBe("loading");
    controller.update(10001);
    expect(state).toEqual({ status: "result", result: "65", isFallback: true });
    resolve(sourceModel());
    await Promise.resolve();
    expect(state).toEqual({ status: "result", result: "65", isFallback: true });
    controller.dispose();
  });
});
