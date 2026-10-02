import { describe, expect, test } from "vitest";

import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { isSeoulGridCellValid, toSeoulGridCellKm } from "./seoulGridNumber";
import {
  getSeoulGridSelectableCells,
  isSeoulGridCellOnNumberLine,
  isSeoulGridCellSelectable,
} from "./seoulGridNumberLines";

const { rows } = SEOUL_GRID_MAP_CONFIG;

describe("seoul grid number lines", () => {
  test("selects nothing without numbers", () => {
    expect(getSeoulGridSelectableCells([])).toEqual([]);
  });

  test("selects only the column and row of a single number", () => {
    const cells = getSeoulGridSelectableCells([52]);

    expect(cells.length).toBeGreaterThan(0);
    expect(
      cells.every((cell) => {
        const { eastKm, northKm } = toSeoulGridCellKm(cell);

        return eastKm % 100 === 52 || northKm % 100 === 52;
      })
    ).toBe(true);
    expect(cells.every(isSeoulGridCellValid)).toBe(true);
  });

  test("unions the lines of several numbers", () => {
    const first = getSeoulGridSelectableCells([52]);
    const second = getSeoulGridSelectableCells([53]);
    const both = getSeoulGridSelectableCells([52, 53]);

    expect(both.length).toBe(new Set([...first, ...second].map(toKey)).size);
  });

  test("leaves only vertical lines for numbers with no north row", () => {
    const northKmMax = SEOUL_GRID_MAP_CONFIG.originKm.y + rows - 1;
    const number = northKmMax % 100;
    const cells = getSeoulGridSelectableCells([number + 1]);

    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((cell) => toSeoulGridCellKm(cell).eastKm % 100 === number + 1)).toBe(true);
  });

  test("rejects cells outside seoul even on a number line", () => {
    const cell = { column: 0, row: 0 };
    const { eastKm } = toSeoulGridCellKm(cell);

    expect(isSeoulGridCellOnNumberLine(cell, [eastKm % 100])).toBe(true);
    expect(isSeoulGridCellSelectable(cell, [eastKm % 100])).toBe(false);
  });
});

function toKey({ column, row }: { column: number; row: number }): string {
  return `${column}:${row}`;
}
