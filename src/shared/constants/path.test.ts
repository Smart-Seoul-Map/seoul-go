import { describe, expect, test } from "vitest";

import { createSubwayStationExplorationPath, PATH } from "./path";

describe("exploration path", () => {
  test("creates an exploration path from a subway station number", () => {
    const path = createSubwayStationExplorationPath("201");

    expect(path).toBe("/exploration/stations/201");
    expect(PATH.SUBWAY_STATION_EXPLORATION).toContain(":stationId");
  });
});
