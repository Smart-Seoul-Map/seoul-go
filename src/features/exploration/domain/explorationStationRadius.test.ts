import { describe, expect, test } from "vitest";

import {
  getRequiredStationExplorationVisitCount,
  getUnlockedStationExplorationRadius,
  STATION_EXPLORATION_MAX_REQUIRED_VISIT_COUNT,
  STATION_EXPLORATION_RADIUS_STEPS,
} from "./explorationStationRadius";

describe("station exploration radius", () => {
  test("calculates the required visit count from current radius places", () => {
    expect(getRequiredStationExplorationVisitCount(20)).toBe(3);
    expect(getRequiredStationExplorationVisitCount(6)).toBe(3);
    expect(getRequiredStationExplorationVisitCount(3)).toBe(2);
    expect(getRequiredStationExplorationVisitCount(1)).toBe(1);
    expect(getRequiredStationExplorationVisitCount(0)).toBe(0);
  });

  test("starts station exploration with a 500m radius", () => {
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 20,
        currentRadiusMeters: 500,
        visitedPlaceCount: 0,
      })
    ).toBe(500);
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 20,
        currentRadiusMeters: 500,
        visitedPlaceCount: 2,
      })
    ).toBe(500);
  });

  test("unlocks the next radius when required visits are completed", () => {
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 20,
        currentRadiusMeters: 500,
        visitedPlaceCount: 3,
      })
    ).toBe(1000);
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 3,
        currentRadiusMeters: 500,
        visitedPlaceCount: 2,
      })
    ).toBe(1000);
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 1,
        currentRadiusMeters: 1000,
        visitedPlaceCount: 1,
      })
    ).toBe(2000);
  });

  test("keeps the current radius when there are no places to visit", () => {
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 0,
        currentRadiusMeters: 500,
        visitedPlaceCount: 0,
      })
    ).toBe(500);
  });

  test("falls back to the first radius step for invalid inputs", () => {
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 20,
        currentRadiusMeters: 500,
        visitedPlaceCount: -1,
      })
    ).toBe(500);
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: Number.NaN,
        currentRadiusMeters: 500,
        visitedPlaceCount: 3,
      })
    ).toBe(500);
    expect(
      getUnlockedStationExplorationRadius({
        currentRadiusPlaceCount: 20,
        currentRadiusMeters: 777,
        visitedPlaceCount: 3,
      })
    ).toBe(500);
  });

  test("keeps station radius steps sorted by unlock condition", () => {
    expect(STATION_EXPLORATION_MAX_REQUIRED_VISIT_COUNT).toBe(3);
    expect(STATION_EXPLORATION_RADIUS_STEPS).toEqual([
      { radiusMeters: 500 },
      { radiusMeters: 1000 },
      { radiusMeters: 2000 },
    ]);
  });
});
