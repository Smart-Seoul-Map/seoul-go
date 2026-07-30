import { describe, expect, test } from "vitest";

import {
  getLine2StationById,
  LINE2_BRANCH_STATION_IDS,
  LINE2_MAIN_LOOP_STATIONS,
  LINE2_STATIONS,
} from "./line2SelectionConfig";

describe("line 2 selection config", () => {
  test("builds line 2 stations from the relational subway station data", () => {
    expect(LINE2_MAIN_LOOP_STATIONS).toHaveLength(43);
    expect(LINE2_STATIONS).toHaveLength(51);
    expect(LINE2_STATIONS[0]).toEqual({
      address: "서울특별시 중구 서소문로 지하 127",
      id: "201",
      location: { lat: 37.564718, lng: 126.977108 },
      name: "시청",
      position: { x: 46.73, y: 15.28 },
    });
  });

  test("keeps each branch connected to its junction station", () => {
    expect(LINE2_BRANCH_STATION_IDS).toEqual([
      ["211", "244", "245", "246", "247"],
      ["234", "248", "249", "250", "251"],
    ]);
  });

  test("finds a station by its station number", () => {
    expect(getLine2StationById("201")?.name).toBe("시청");
    expect(getLine2StationById("unknown")).toBeNull();
  });
});
