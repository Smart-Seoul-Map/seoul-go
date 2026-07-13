import { describe, expect, test } from "vitest";

import { createDistrictExplorationPath, matchDistrictExplorationPath } from "./path";

describe("path constants", () => {
  test("creates district exploration path", () => {
    expect(createDistrictExplorationPath(8)).toBe("/exploration/districts/8");
  });

  test("matches district exploration path", () => {
    expect(matchDistrictExplorationPath("/exploration/districts/8")).toBe(8);
  });

  test("returns null for unrelated paths", () => {
    expect(matchDistrictExplorationPath("/roulette")).toBeNull();
    expect(matchDistrictExplorationPath("/exploration/districts/yongsan")).toBeNull();
  });
});
