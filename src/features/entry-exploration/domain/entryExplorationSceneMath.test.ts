import { describe, expect, test } from "vitest";

import { toCharacterModelRotationRadians } from "../../../shared/lib/character/characterModelRotation";
import {
  getEntryExplorationSceneDistance,
  getEntryExplorationSceneHeadingRadians,
  interpolateEntryExplorationScenePoint,
} from "./entryExplorationSceneMath";

describe("entry exploration scene math", () => {
  test("calculates distance on the floor plane", () => {
    expect(getEntryExplorationSceneDistance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });

  test("interpolates a floor point by ratio", () => {
    expect(interpolateEntryExplorationScenePoint({ x: 0, z: 0 }, { x: 10, z: -20 }, 0.25)).toEqual({
      x: 2.5,
      z: -5,
    });
  });

  test("returns a stable heading for the same point", () => {
    expect(getEntryExplorationSceneHeadingRadians({ x: 1, z: 1 }, { x: 1, z: 1 })).toBe(0);
  });

  test("maps floor movement direction to the shared character model rotation", () => {
    const origin = { x: 0, z: 0 };

    expect(
      toCharacterModelRotationRadians(
        getEntryExplorationSceneHeadingRadians(origin, { x: 0, z: 1 })
      )
    ).toBeCloseTo(0);
    expect(
      toCharacterModelRotationRadians(
        getEntryExplorationSceneHeadingRadians(origin, { x: 1, z: 0 })
      )
    ).toBeCloseTo(Math.PI / 2);
    expect(
      toCharacterModelRotationRadians(
        getEntryExplorationSceneHeadingRadians(origin, { x: 0, z: -1 })
      )
    ).toBeCloseTo(Math.PI);
    expect(
      toCharacterModelRotationRadians(
        getEntryExplorationSceneHeadingRadians(origin, { x: -1, z: 0 })
      )
    ).toBeCloseTo(-Math.PI / 2);
  });
});
