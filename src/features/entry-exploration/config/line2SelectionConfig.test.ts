import { describe, expect, test } from "vitest";

import {
  LINE2_BRANCH_STATION_IDS,
  LINE2_MAIN_LOOP_STATIONS,
  LINE2_STATIONS,
} from "./line2SelectionConfig";

describe("line 2 selection config", () => {
  test("builds line 2 stations from the relational subway station data", () => {
    expect(LINE2_MAIN_LOOP_STATIONS).toHaveLength(43);
    expect(LINE2_STATIONS).toHaveLength(51);
    expect(LINE2_STATIONS[0]).toEqual({
      id: "201",
      name: "시청",
      position: { x: 46.73, y: 15.28 },
    });
  });

  test("keeps each branch connected to its junction station", () => {
    expect(LINE2_BRANCH_STATION_IDS).toEqual([
      ["211", "211-1", "211-2", "211-3", "211-4"],
      ["234", "234-1", "234-2", "234-3", "234-4"],
    ]);
  });
});
