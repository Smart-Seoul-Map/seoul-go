import { describe, expect, test } from "vitest";

import { toSeoulGridCellCenter } from "./seoulGridCoordinates";
import { getSeoulGridCellDistrictId, toSeoulGridNumber } from "./seoulGridNumber";

const dongdaemunCell = { column: 27, row: 14 };

describe("seoul grid coordinates", () => {
  test("maps a cell to its grid number, district and center point", () => {
    expect(toSeoulGridNumber(dongdaemunCell)).toBe("다사6252");
    expect(getSeoulGridCellDistrictId(dongdaemunCell)).toBe(18);
    expect(toSeoulGridCellCenter(dongdaemunCell).lng).toBeCloseTo(127.0753, 3);
    expect(toSeoulGridCellCenter(dongdaemunCell).lat).toBeCloseTo(37.5711, 3);
  });

  test("keeps cell centers ordered from north-west to south-east", () => {
    const northWest = toSeoulGridCellCenter({ column: 0, row: 0 });
    const southEast = toSeoulGridCellCenter({ column: 37, row: 30 });

    expect(northWest.lng).toBeLessThan(southEast.lng);
    expect(northWest.lat).toBeGreaterThan(southEast.lat);
  });
});
