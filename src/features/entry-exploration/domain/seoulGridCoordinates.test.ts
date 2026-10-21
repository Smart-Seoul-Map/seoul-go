import { describe, expect, test } from "vitest";

import { toSeoulGridCellCenter, toSeoulGridCellFromGeoPoint } from "./seoulGridCoordinates";
import {
  getSeoulGridCellDistrictId,
  getSeoulGridCells,
  isSeoulGridCellValid,
  toSeoulGridNumber,
} from "./seoulGridNumber";

const dongdaemunCell = { column: 27, row: 14 };

const EDITION_PLACE_GRID_NUMBERS = [
  {
    name: "남산공원 백범광장",
    position: { lat: 37.554896208, lng: 126.979811846 },
    gridNumber: "다사5450",
    isSeoulCell: true,
  },
  {
    name: "용양봉저정공원",
    position: { lat: 37.511399831, lng: 126.958930471 },
    gridNumber: "다사5245",
    isSeoulCell: true,
  },
  {
    name: "강변서재",
    position: { lat: 37.532911966, lng: 126.916403914 },
    gridNumber: "다사4848",
    isSeoulCell: true,
  },
  {
    name: "아차산 어울림정원",
    position: { lat: 37.551896984, lng: 127.101245038 },
    gridNumber: "다사6450",
    isSeoulCell: true,
  },
  {
    name: "서울 암사동 유적체험마을",
    position: { lat: 37.559852344, lng: 127.130833307 },
    gridNumber: "다사6751",
    isSeoulCell: true,
  },
  {
    name: "홍제천 인공폭포",
    position: { lat: 37.581315677, lng: 126.937130858 },
    gridNumber: "다사5053",
    isSeoulCell: true,
  },
  {
    name: "관악산",
    position: { lat: 37.44509452, lng: 126.963660055 },
    gridNumber: "다사5238",
    isSeoulCell: false,
  },
  {
    name: "서울창포원",
    position: { lat: 37.689544174, lng: 127.047228295 },
    gridNumber: "다사6065",
    isSeoulCell: false,
  },
];

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

  test("finds every board cell again from its own center point", () => {
    const cells = getSeoulGridCells();
    const mismatches = cells.filter((cell) => {
      const found = toSeoulGridCellFromGeoPoint(toSeoulGridCellCenter(cell));

      return found?.column !== cell.column || found?.row !== cell.row;
    });

    expect(cells).toHaveLength(1178);
    expect(mismatches).toEqual([]);
  });

  test.each(EDITION_PLACE_GRID_NUMBERS)(
    "finds the grid cell of $name from its position",
    ({ position, gridNumber, isSeoulCell }) => {
      const cell = toSeoulGridCellFromGeoPoint(position);

      expect(cell).not.toBeNull();
      expect(toSeoulGridNumber(cell!)).toBe(gridNumber);
      expect(isSeoulGridCellValid(cell!)).toBe(isSeoulCell);
    }
  );

  test.each([
    { label: "west of the board", position: { lat: 37.55, lng: 126.5 } },
    { label: "east of the board", position: { lat: 37.55, lng: 127.3 } },
    { label: "north of the board", position: { lat: 37.75, lng: 127.0 } },
    { label: "south of the board", position: { lat: 37.35, lng: 127.0 } },
    { label: "far away", position: { lat: 35.1796, lng: 129.0756 } },
    { label: "not a number", position: { lat: Number.NaN, lng: Number.NaN } },
  ])("returns null for a position $label", ({ position }) => {
    expect(toSeoulGridCellFromGeoPoint(position)).toBeNull();
  });
});
