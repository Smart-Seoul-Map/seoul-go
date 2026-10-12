import { describe, expect, test } from "vitest";

import {
  createDistrictExplorationTarget,
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
