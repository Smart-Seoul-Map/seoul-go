import { describe, expect, test } from "vitest";

import { isSeoulGridCellValid } from "./seoulGridNumber";
import { getSeoulGridValidCells, pickRandomSeoulGridCell } from "./seoulGridRandomCell";

describe("seoul grid random cell", () => {
  test("collects only cells that belong to a district", () => {
    const cells = getSeoulGridValidCells();

    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every(isSeoulGridCellValid)).toBe(true);
  });

  test("picks the first cell when the random source returns its lowest value", () => {
    const cells = getSeoulGridValidCells();

    expect(pickRandomSeoulGridCell(() => 0)).toEqual(cells[0]);
  });

  test("keeps the picked index inside the range when the random source returns one", () => {
    const cells = getSeoulGridValidCells();

    expect(pickRandomSeoulGridCell(() => 1)).toEqual(cells[cells.length - 1]);
  });
});
