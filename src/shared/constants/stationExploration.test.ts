import { describe, expect, test } from "vitest";

import { STATION_EXPLORATION_RADIUS_METERS } from "./stationExploration";

describe("station exploration constants", () => {
  test("uses a fixed 1km exploration radius", () => {
    expect(STATION_EXPLORATION_RADIUS_METERS).toBe(1000);
  });
});
