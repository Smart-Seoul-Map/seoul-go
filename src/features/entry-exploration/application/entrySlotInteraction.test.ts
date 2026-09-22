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
  let state: EntrySlotState = { status: "loading" };
  const controller = createEntrySlotInteraction({
    onStateChange: (next) => {
      state = next;
    },
  });
  await vi.waitFor(() => expect(state.status).toBe("closed"));
  return { controller, state: () => state };
}

function ready(controller: ReturnType<typeof createEntrySlotInteraction>) {
  controller.updateTriggerState(controller.getActivationCharacterDestination());
  controller.activate(0);
  const camera = new THREE.OrthographicCamera(-12, 12, 9.5, -9.5, 0.1, 1000);
  camera.position.set(14, 13, 14);
  controller.updateCamera(camera, 0, { x: 0, z: 0 });
  controller.updateCamera(camera, 1000, { x: 0, z: 0 });
  return camera;
}

describe("entry slot interaction", () => {
  test("arrival focuses the camera but does not spin until explicit input", async () => {
    const { controller, state } = await setup();
    expect(controller.canActivate()).toBe(false);
    controller.updateTriggerState(controller.getActivationCharacterDestination());
    expect(controller.canActivate()).toBe(true);
    ready(controller);
    expect(state().status).toBe("ready");
    controller.update(9999);
    expect(state().status).toBe("ready");
    controller.dispose();
  });

  test("only reels rotate, repeated spin is ignored, and the stopped result matches left/right", async () => {
    const { controller, state } = await setup();
    ready(controller);
    const body = controller.object.getObjectByName("slot")!;
    const lever = controller.object.getObjectByName("slot_lever")!;
    const before = [body.quaternion.clone(), lever.quaternion.clone()];
    expect(controller.spin(1000, [0, 9])).toBe(true);
    expect(controller.spin(1001, [1, 2])).toBe(false);
    controller.update(1500);
    expect(state().status).toBe("spinning");
    for (const name of ENTRY_SLOT_CONFIG.reelNames) {
      expect(controller.object.getObjectByName(name)?.rotation.z).not.toBeCloseTo(-Math.PI / 2);
    }
    expect(body.quaternion.equals(before[0])).toBe(true);
    expect(lever.quaternion.equals(before[1])).toBe(true);
    controller.update(4000);
    expect(state()).toEqual({ status: "result", result: "09" });
    expect(controller.spin(5000, [4, 2])).toBe(true);
    controller.update(8000);
    expect(state()).toEqual({ status: "result", result: "42" });
    controller.dispose();
  });

  test("closing cancels a spin and requires trigger exit before automatic reopening", async () => {
    const { controller, state } = await setup();
    ready(controller);
    controller.spin(1000, [1, 2]);
    controller.deactivate();
    controller.update(5000);
    expect(state().status).toBe("closed");
    expect(controller.isActive()).toBe(false);
    controller.updateTriggerState(controller.getActivationCharacterDestination());
    expect(controller.canActivate()).toBe(false);
    controller.updateTriggerState({ x: 100, z: 100 });
    controller.updateTriggerState(controller.getActivationCharacterDestination());
    expect(controller.canActivate()).toBe(true);
    controller.dispose();
  });

  test("a model hit offers an approach destination but never spins from outside the trigger", async () => {
    const { controller, state } = await setup();
    controller.object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(controller.object);
    const center = bounds.getCenter(new THREE.Vector3());
    const origin = center.clone().add(new THREE.Vector3(10, 0, 10));
    const raycaster = new THREE.Raycaster(origin, center.clone().sub(origin).normalize());
    expect(controller.getPointerDestination(raycaster)).toEqual(
      controller.getActivationCharacterDestination()
    );
    expect(controller.handlePointerDown(raycaster, 0)).toBe(false);
    expect(state().status).toBe("closed");
    ready(controller);
    expect(controller.handlePointerDown(raycaster, 1000)).toBe(true);
    expect(state().status).toBe("spinning");
    controller.dispose();
  });

  test("keeps the model inside a narrow camera after resize", async () => {
    const { controller } = await setup();
    const camera = ready(controller);
    camera.left = -3.6;
    camera.right = 3.6;
    controller.updateCamera(camera, 2000, { x: 0, z: 0 });
    const bounds = new THREE.Box3().setFromObject(controller.object);
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const projected = new THREE.Vector3(x, y, z).project(camera);
          expect(Math.abs(projected.x)).toBeLessThan(1);
          expect(projected.y).toBeGreaterThan(-0.6);
          expect(projected.y).toBeLessThan(1);
        }
      }
    }
    controller.dispose();
  });

  test("frames the model between the header and controls on a short viewport", async () => {
    const { controller } = await setup();
    const camera = ready(controller);
    controller.setViewportBounds({ top: 56 / 320, bottom: 220 / 320 });
    controller.updateCamera(camera, 2000, { x: 0, z: 0 });
    const bounds = new THREE.Box3().setFromObject(controller.object);
    for (const y of [bounds.min.y, bounds.max.y]) {
      const projected = new THREE.Vector3(bounds.min.x, y, bounds.min.z).project(camera);
      const screenY = ((1 - projected.y) / 2) * 320;
      expect(screenY).toBeGreaterThan(56);
      expect(screenY).toBeLessThan(220);
    }
    controller.dispose();
  });

  test("reports loading errors, supports retry, and ignores late completion after disposal", async () => {
    vi.mocked(loadEntryExplorationGltf).mockRejectedValueOnce(new Error("offline"));
    const onStateChange = vi.fn();
    const controller = createEntrySlotInteraction({ onStateChange });
    await vi.waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith({ status: "error" }));
    expect(controller.canActivate()).toBe(false);
    let resolve!: (value: ReturnType<typeof sourceModel>) => void;
    vi.mocked(loadEntryExplorationGltf).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    controller.retryLoad();
    controller.dispose();
    onStateChange.mockClear();
    resolve(sourceModel());
    await Promise.resolve();
    expect(controller.object.children).toHaveLength(0);
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
