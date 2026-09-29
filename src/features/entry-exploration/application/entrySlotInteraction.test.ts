import * as THREE from "three";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ENTRY_SLOT_CONFIG } from "../config/entrySlotConfig";
import { loadEntryExplorationGltf } from "./entryExplorationGltfLoader";
import { createEntrySlotInteraction, type EntrySlotState } from "./entrySlotInteraction";

vi.mock("./entryExplorationGltfLoader", () => ({ loadEntryExplorationGltf: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

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

function getProjectedModelBounds(object: THREE.Object3D, camera: THREE.Camera): THREE.Box3 {
  const bounds = new THREE.Box3();
  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const vertices = child.geometry.getAttribute("position");
    for (let index = 0; index < vertices.count; index++) {
      const vertex = new THREE.Vector3().fromBufferAttribute(vertices, index);
      bounds.expandByPoint(vertex.applyMatrix4(child.matrixWorld).project(camera));
    }
  });
  return bounds;
}

describe("reward slot interaction", () => {
  test.each([false, true])(
    "settles only the slot body after a stop (reduced motion: %s)",
    async (reduced) => {
      vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
      const { controller, state } = await setup();
      const camera = focus(controller);
      const cameraPosition = camera.position.clone();
      const machine = controller.object.children[0];
      const position = machine.position.clone();
      controller.update(1050);
      controller.update(2670);
      expect(machine.position.equals(position)).toBe(reduced);
      controller.update(3050);
      expect(state()).toEqual({ status: "result", result: "40" });
      controller.update(3070);
      expect(machine.position.equals(position)).toBe(reduced);
      controller.updateCamera(camera, 3070, { x: 20, z: 30 });
      expect(camera.position.equals(cameraPosition)).toBe(true);
      controller.update(3300);
      expect(machine.position.equals(position)).toBe(true);
      controller.deactivate();
      expect(machine.position.equals(position)).toBe(true);
      controller.dispose();
    }
  );
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

  test("stages the character only after covering and restores its pose and surroundings on close", async () => {
    const { controller, state } = await setup();
    const character = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2.3, 1));
    mesh.position.y = 1.15;
    character.add(mesh);
    character.position.set(20, 0, 30);
    character.rotation.y = 1.2;
    const rotation = character.quaternion.clone();
    const scenery = new THREE.Group();
    const hiddenObject = new THREE.Group();
    hiddenObject.visible = false;
    controller.setSurroundings?.([scenery, hiddenObject]);
    controller.setCharacter?.(character);
    controller.requestReward([4, 0]);
    controller.activate(0);
    controller.deactivate();
    expect(state().status).toBe("covering");
    expect(character.visible).toBe(true);
    expect(character.position.toArray()).toEqual([20, 0, 30]);
    expect(scenery.visible).toBe(true);
    const camera = new THREE.OrthographicCamera(-12, 12, 9.5, -9.5, 0.1, 1000);
    controller.updateCamera(camera, 0, { x: 20, z: 30 });
    controller.update(240);
    expect(character.visible).toBe(true);
    expect(character.position.toArray()).not.toEqual([20, 0, 30]);
    expect(scenery.visible).toBe(false);
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
    expect(character.quaternion.equals(rotation)).toBe(true);
    expect(scenery.visible).toBe(true);
    expect(hiddenObject.visible).toBe(false);
    expect(controller.canActivate()).toBe(false);
    controller.dispose();
  });

  test("restores an originally hidden character and scenery when disposed during presentation", async () => {
    const { controller } = await setup();
    const character = new THREE.Group();
    character.position.set(20, 0, 30);
    character.rotation.y = 0.8;
    character.visible = false;
    const rotation = character.quaternion.clone();
    const scenery = new THREE.Group();
    controller.setCharacter?.(character);
    controller.setSurroundings?.([scenery]);
    focus(controller);
    expect(character.visible).toBe(true);
    expect(scenery.visible).toBe(false);
    controller.dispose();
    expect(character.visible).toBe(false);
    expect(character.position.toArray()).toEqual([20, 0, 30]);
    expect(character.quaternion.equals(rotation)).toBe(true);
    expect(scenery.visible).toBe(true);
  });

  test.each([
    [1366, 900],
    [390, 844],
    [320, 640],
    [844, 390],
  ])("frames the slot and character without overlap at %i by %i", async (width, height) => {
    const { controller } = await setup();
    const character = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 2.3, 1));
    body.position.y = 1.15;
    character.add(body);
    character.position.set(20, 0, 30);
    controller.setCharacter?.(character);
    const camera = focus(controller);
    camera.left = (-9.5 * width) / height;
    camera.right = (9.5 * width) / height;
    const controlsTop = (height - 110) / height;
    controller.setViewportBounds({ top: 0, bottom: controlsTop });
    controller.updateCamera(camera, 600, { x: 20, z: 30 });
    const slotBounds = getProjectedModelBounds(controller.object, camera);
    const characterBounds = getProjectedModelBounds(character, camera);
    for (const bounds of [slotBounds, characterBounds]) {
      expect(bounds.min.x).toBeGreaterThan(-1);
      expect(bounds.max.x).toBeLessThan(1);
      expect(bounds.max.y).toBeLessThan(1);
      expect((1 - bounds.min.y) / 2).toBeLessThan(controlsTop);
    }
    expect(characterBounds.max.x).toBeLessThan(slotBounds.min.x);
    expect(camera.position.y).toBeGreaterThan(3.6);
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
    const bounds = getProjectedModelBounds(controller.object, camera);
    expect(bounds.min.x).toBeGreaterThan(-1);
    expect(bounds.max.x).toBeLessThan(1);
    expect(bounds.min.y).toBeGreaterThan(-0.6);
    expect(bounds.max.y).toBeLessThan(1);
    controller.dispose();
  });

  test("frames the model above the result controls on a short viewport", async () => {
    const { controller } = await setup();
    const camera = focus(controller);
    controller.setViewportBounds({ top: 0, bottom: 220 / 320 });
    controller.updateCamera(camera, 2000, { x: 20, z: 30 });
    const bounds = getProjectedModelBounds(controller.object, camera);
    for (const y of [bounds.min.y, bounds.max.y]) {
      const screenY = ((1 - y) / 2) * 320;
      expect(screenY).toBeGreaterThan(0);
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
