import { describe, expect, test } from "vitest";
import * as THREE from "three";

import { updateEntryExplorationCameraFocus } from "./entryExplorationThreeScene";

describe("updateEntryExplorationCameraFocus", () => {
  test("restores the camera zoom for normal exploration", () => {
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    camera.zoom = 1.55;
    updateEntryExplorationCameraFocus(camera, { x: 2, z: 3 });

    expect(camera.zoom).toBe(1);
  });
});
