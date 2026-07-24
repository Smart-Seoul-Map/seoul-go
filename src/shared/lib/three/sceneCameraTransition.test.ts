import * as THREE from "three";
import { describe, expect, test } from "vitest";

import { createSceneCameraTransition, updateSceneCameraTransition } from "./sceneCameraTransition";

describe("sceneCameraTransition", () => {
  test("moves camera position, look target, and zoom toward the target values", () => {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

    camera.position.set(0, 10, 10);
    camera.zoom = 1;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrixWorld();

    const transition = createSceneCameraTransition({
      camera,
      durationMs: 1_000,
      easing: (progress) => progress,
      now: 0,
      toLookAt: new THREE.Vector3(1, 2, 3),
      toPosition: new THREE.Vector3(10, 20, 30),
      toZoom: 2,
    });

    expect(updateSceneCameraTransition(transition, 500).done).toBe(false);
    expect(camera.position.x).toBeCloseTo(5);
    expect(camera.position.y).toBeCloseTo(15);
    expect(camera.position.z).toBeCloseTo(20);
    expect(camera.zoom).toBeCloseTo(1.5);

    expect(updateSceneCameraTransition(transition, 1_000).done).toBe(true);
    expect(camera.position.x).toBeCloseTo(10);
    expect(camera.position.y).toBeCloseTo(20);
    expect(camera.position.z).toBeCloseTo(30);
    expect(camera.zoom).toBeCloseTo(2);

    const direction = camera.getWorldDirection(new THREE.Vector3());
    const expectedDirection = new THREE.Vector3(1, 2, 3)
      .sub(new THREE.Vector3(10, 20, 30))
      .normalize();

    expect(direction.x).toBeCloseTo(expectedDirection.x);
    expect(direction.y).toBeCloseTo(expectedDirection.y);
    expect(direction.z).toBeCloseTo(expectedDirection.z);
  });

  test("finishes immediately when duration is zero", () => {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const transition = createSceneCameraTransition({
      camera,
      durationMs: 0,
      now: 0,
      toLookAt: new THREE.Vector3(0, 0, 0),
      toPosition: new THREE.Vector3(1, 2, 3),
      toZoom: 1.25,
    });

    expect(updateSceneCameraTransition(transition, 0).done).toBe(true);
    expect(camera.position).toEqual(new THREE.Vector3(1, 2, 3));
    expect(camera.zoom).toBe(1.25);
  });
});
