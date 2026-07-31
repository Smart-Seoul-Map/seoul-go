import { describe, expect, test } from "vitest";

import {
  createDistrictExplorationTarget,
  createStationExplorationTarget,
  isDistrictExplorationTarget,
  parseDistrictExplorationTargetIdParam,
} from "./explorationTarget";

describe("createDistrictExplorationTarget", () => {
  test("creates an exploration target from a Seoul district", () => {
    expect(
      createDistrictExplorationTarget({
        id: 8,
        name: "district-a",
        officePosition: { lat: 37.532326, lng: 126.990703 },
      })
    ).toEqual({
      center: { lat: 37.532326, lng: 126.990703 },
      districtId: 8,
      districtName: "district-a",
      type: "district",
    });
  });
});

describe("createStationExplorationTarget", () => {
  test("keeps the station center and radius as the exploration target", () => {
    expect(
      createStationExplorationTarget({
        center: { lat: 37.5657, lng: 126.9769 },
        radiusMeters: 500,
        stationId: "201",
        stationName: "Station A",
      })
    ).toEqual({
      center: { lat: 37.5657, lng: 126.9769 },
      radiusMeters: 500,
      stationId: "201",
      stationName: "Station A",
      type: "station",
    });
  });
});

describe("isDistrictExplorationTarget", () => {
  test("narrows only district targets", () => {
    const districtTarget = createDistrictExplorationTarget({
      id: 8,
      name: "district-a",
      officePosition: { lat: 37.532326, lng: 126.990703 },
    });
    const stationTarget = createStationExplorationTarget({
      center: { lat: 37.5657, lng: 126.9769 },
      radiusMeters: 500,
      stationId: "201",
      stationName: "Station A",
    });

    expect(isDistrictExplorationTarget(districtTarget)).toBe(true);
    expect(isDistrictExplorationTarget(stationTarget)).toBe(false);
    expect(isDistrictExplorationTarget(null)).toBe(false);
  });
});

describe("parseDistrictExplorationTargetIdParam", () => {
  test("parses a positive integer route param", () => {
    expect(parseDistrictExplorationTargetIdParam("8")).toBe(8);
  });

  test("returns null for empty or invalid route params", () => {
    expect(parseDistrictExplorationTargetIdParam(undefined)).toBeNull();
    expect(parseDistrictExplorationTargetIdParam("abc")).toBeNull();
    expect(parseDistrictExplorationTargetIdParam("1.5")).toBeNull();
    expect(parseDistrictExplorationTargetIdParam("0")).toBeNull();
  });
});
