import { describe, expect, test } from "vitest";

import { distanceMeters } from "./explorationGeo";
import { advanceCoordinatesByScreenDirection } from "./explorationDirectionalMovement";

const ORIGIN = { lat: 37.5665, lng: 126.978 };

describe("advanceCoordinatesByScreenDirection", () => {
  test("moves screen-up toward north when the map bearing is zero", () => {
    const nextPosition = advanceCoordinatesByScreenDirection(ORIGIN, { x: 0, y: -1 }, 100, 0);

    expect(nextPosition.lat).toBeGreaterThan(ORIGIN.lat);
    expect(nextPosition.lng).toBeCloseTo(ORIGIN.lng, 6);
    expect(distanceMeters(ORIGIN, nextPosition)).toBeCloseTo(100, 1);
  });

  test("rotates screen direction by the map bearing", () => {
    const nextPosition = advanceCoordinatesByScreenDirection(ORIGIN, { x: 0, y: -1 }, 100, 90);

    expect(nextPosition.lng).toBeGreaterThan(ORIGIN.lng);
    expect(nextPosition.lat).toBeCloseTo(ORIGIN.lat, 6);
    expect(distanceMeters(ORIGIN, nextPosition)).toBeCloseTo(100, 1);
  });

  test("preserves joystick strength", () => {
    const nextPosition = advanceCoordinatesByScreenDirection(ORIGIN, { x: 0.5, y: 0 }, 100, 0);

    expect(distanceMeters(ORIGIN, nextPosition)).toBeCloseTo(50, 1);
  });
});
