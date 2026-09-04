import { describe, expect, test } from "vitest";

import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { isSeoulGridCellValid, toSeoulGridCell, toSeoulGridNumber } from "./seoulGridNumber";

const MAP_SIZE = { depth: 9.79, width: 12 };
const CHEONGUN_HYOJA_CELL = {
  column: 252 - SEOUL_GRID_MAP_CONFIG.originKm.x,
  row: SEOUL_GRID_MAP_CONFIG.rows - 1 - (653 - SEOUL_GRID_MAP_CONFIG.originKm.y),
};

describe("seoul grid number", () => {
  test("maps the top left corner of the map to the first cell", () => {
    expect(toSeoulGridCell({ u: -MAP_SIZE.width / 2, v: MAP_SIZE.depth / 2 }, MAP_SIZE)).toEqual({
      column: 0,
      row: 0,
    });
  });

  test("formats the national point number of a known cell", () => {
    expect(toSeoulGridNumber(CHEONGUN_HYOJA_CELL)).toBe("다사5253");
  });

  test("accepts cells on seoul and rejects the empty corners", () => {
    expect(isSeoulGridCellValid(CHEONGUN_HYOJA_CELL)).toBe(true);
    expect(isSeoulGridCellValid({ column: 0, row: 0 })).toBe(false);
  });
});
