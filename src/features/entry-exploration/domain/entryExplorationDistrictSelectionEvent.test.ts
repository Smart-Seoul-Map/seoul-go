import { describe, expect, test } from "vitest";

import {
  calculateEntryExplorationBounceContactRatio,
  calculateEntryExplorationBounceHeight,
  calculateEntryExplorationBounceSquashScale,
  calculateEntryExplorationMapGradientRatio,
  calculateEntryExplorationSelectionLandingPoint,
  calculateEntryExplorationSelectionPowerRatio,
  findEntryExplorationDistrictByPoint,
  normalizeEntryExplorationSelectionDirection,
  projectEntryExplorationDistrictBoundaries,
  type EntryExplorationDistrictBoundaryFeature,
} from "./entryExplorationDistrictSelectionEvent";

const MAP_SIZE = {
  depth: 10,
  width: 10,
} as const;

const DISTRICT_BOUNDARIES = [
  {
    type: "Feature",
    properties: {
      districtId: 1,
      name: "west",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [126, 38],
          [127, 38],
          [127, 37],
          [126, 37],
          [126, 38],
        ],
      ],
    },
  },
  {
    type: "Feature",
    properties: {
      districtId: 2,
      name: "east",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [127, 38],
          [128, 38],
          [128, 37],
          [127, 37],
          [127, 38],
        ],
      ],
    },
  },
] as const satisfies readonly EntryExplorationDistrictBoundaryFeature[];

describe("entry exploration district selection event", () => {
  test("projects district boundaries into centered floor-map coordinates while preserving aspect ratio", () => {
    const districts = projectEntryExplorationDistrictBoundaries({
      boundaries: DISTRICT_BOUNDARIES,
      mapSize: MAP_SIZE,
      padding: 0,
    });

    expect(districts).toHaveLength(2);
    expect(districts[0]?.polygons[0]?.rings[0]?.[0]).toEqual({ x: -5, y: 2.5 });
    expect(districts[1]?.polygons[0]?.rings[0]?.[2]).toEqual({ x: 5, y: -2.5 });
  });

  test("finds a selected district from the same projected polygons used for 3D mesh rendering", () => {
    const districts = projectEntryExplorationDistrictBoundaries({
      boundaries: DISTRICT_BOUNDARIES,
      mapSize: MAP_SIZE,
      padding: 0,
    });

    expect(findEntryExplorationDistrictByPoint({ x: -2.5, y: 0 }, districts)?.name).toBe("west");
    expect(findEntryExplorationDistrictByPoint({ x: 2.5, y: 0 }, districts)?.name).toBe("east");
    expect(findEntryExplorationDistrictByPoint({ x: 0, y: 6 }, districts)).toBeNull();
  });

  test("clamps hold duration to a power ratio", () => {
    expect(calculateEntryExplorationSelectionPowerRatio(-100, 1000)).toBe(0);
    expect(calculateEntryExplorationSelectionPowerRatio(500, 1000)).toBe(0.5);
    expect(calculateEntryExplorationSelectionPowerRatio(1500, 1000)).toBe(1);
  });

  test("normalizes an aim direction with an upward fallback", () => {
    expect(normalizeEntryExplorationSelectionDirection({ x: 0, y: 0 })).toEqual({ x: 0, y: 1 });
    expect(normalizeEntryExplorationSelectionDirection({ x: 3, y: 4 })).toEqual({
      x: 0.6,
      y: 0.8,
    });
  });

  test("moves the landing point farther as hold duration increases", () => {
    const shortThrowPoint = calculateEntryExplorationSelectionLandingPoint({
      chargeDurationMs: 0,
      chargeMaxDurationMs: 1000,
      direction: { x: 0, y: 1 },
      maxDistance: 8,
      minDistance: 2,
      startPoint: { x: 0, y: -4 },
    });
    const longThrowPoint = calculateEntryExplorationSelectionLandingPoint({
      chargeDurationMs: 1000,
      chargeMaxDurationMs: 1000,
      direction: { x: 0, y: 1 },
      maxDistance: 8,
      minDistance: 2,
      startPoint: { x: 0, y: -4 },
    });

    expect(shortThrowPoint.y).toBeLessThan(longThrowPoint.y);
  });

  test("calculates repeated bounce height with lower bounces near the end", () => {
    const firstBounceHeight = calculateEntryExplorationBounceHeight({
      bounceCount: 4,
      maxHeight: 2,
      progress: 0.125,
    });
    const lateBounceHeight = calculateEntryExplorationBounceHeight({
      bounceCount: 4,
      maxHeight: 2,
      progress: 0.875,
    });

    expect(firstBounceHeight).toBeGreaterThan(1.5);
    expect(lateBounceHeight).toBeLessThan(firstBounceHeight);
    expect(
      calculateEntryExplorationBounceHeight({ bounceCount: 4, maxHeight: 2, progress: 1 })
    ).toBe(0);
  });

  test("squashes the jumper only near ground contact moments", () => {
    const contactScale = calculateEntryExplorationBounceSquashScale({
      bounceCount: 4,
      intensity: 0.18,
      progress: 0.25,
    });
    const airScale = calculateEntryExplorationBounceSquashScale({
      bounceCount: 4,
      intensity: 0.18,
      progress: 0.125,
    });

    expect(contactScale.y).toBeLessThan(airScale.y);
    expect(contactScale.xz).toBeGreaterThan(airScale.xz);
    expect(
      calculateEntryExplorationBounceSquashScale({ bounceCount: 4, intensity: 0.18, progress: 1 })
    ).toEqual({
      xz: 1,
      y: 1,
    });
  });

  test("calculates contact feedback ratio only around bounce landing moments", () => {
    const contactRatio = calculateEntryExplorationBounceContactRatio({
      bounceCount: 4,
      progress: 0.25,
    });
    const apexRatio = calculateEntryExplorationBounceContactRatio({
      bounceCount: 4,
      progress: 0.125,
    });

    expect(contactRatio).toBeGreaterThan(apexRatio);
    expect(apexRatio).toBe(0);
    expect(calculateEntryExplorationBounceContactRatio({ bounceCount: 4, progress: 1 })).toBe(0);
  });

  test("calculates a stable diagonal gradient ratio for the district map surface", () => {
    expect(
      calculateEntryExplorationMapGradientRatio({
        mapSize: MAP_SIZE,
        point: { x: -5, y: 5 },
      })
    ).toBe(0);
    expect(
      calculateEntryExplorationMapGradientRatio({
        mapSize: MAP_SIZE,
        point: { x: 5, y: -5 },
      })
    ).toBe(1);
    expect(
      calculateEntryExplorationMapGradientRatio({
        mapSize: MAP_SIZE,
        point: { x: 0, y: 0 },
      })
    ).toBe(0.5);
  });
});
