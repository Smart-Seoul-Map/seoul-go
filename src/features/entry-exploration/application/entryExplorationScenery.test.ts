import * as THREE from "three";
import { afterEach, expect, test, vi } from "vitest";

import { createEntryExplorationScenery } from "./entryExplorationScenery";
import { getEntryEditionPosition } from "../domain/entryEditionLayout";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { createEntryExplorationGuideRoute } from "../domain/entryExplorationGuideRoute";

afterEach(() => vi.restoreAllMocks());

test("keeps atlas decorations but removes the two example place sprites", () => {
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockReturnValue(new THREE.Texture());
  const scenery = createEntryExplorationScenery();
  expect(scenery.object.getObjectByName("entry-scenery-bench")).toBeTruthy();
  expect(scenery.object.getObjectByName("entry-scenery-hanok")).toBeUndefined();
  expect(scenery.object.getObjectByName("entry-scenery-tower")).toBeUndefined();
  scenery.dispose();
});

test.each([
  [1440, 900],
  [1920, 1080],
  [360, 844],
  [390, 844],
])(
  "keeps ten place destinations apart and preserves the first guide travel at %ix%i",
  (width, height) => {
    const destinations = Array.from({ length: 10 }, (_, index) =>
      getEntryEditionPosition(index, width / height)
    );
    for (let index = 0; index < destinations.length; index += 1) {
      for (const other of destinations.slice(index + 1)) {
        expect(
          Math.hypot(destinations[index].x - other.x, destinations[index].z - other.z)
        ).toBeGreaterThanOrEqual(11.9);
      }
    }
    const origin = ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition;
    const route = createEntryExplorationGuideRoute({
      origin,
      destination: destinations[0],
      cameraOffset: ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset,
    });
    const point = ({ x, z }: { x: number; z: number }) => new THREE.Vector3(x, 0, z);
    const length =
      point(origin).distanceTo(point(route.bendStart)) +
      new THREE.QuadraticBezierCurve3(
        point(route.bendStart),
        point(route.bendControl),
        point(route.bendEnd)
      ).getLength() +
      point(route.bendEnd).distanceTo(point(route.destination));
    const seconds = length / ENTRY_EXPLORATION_SCENE_CONFIG.characterSpeedPerSecond;
    expect(seconds).toBeGreaterThanOrEqual(2);
    expect(seconds).toBeLessThanOrEqual(3);
  }
);
