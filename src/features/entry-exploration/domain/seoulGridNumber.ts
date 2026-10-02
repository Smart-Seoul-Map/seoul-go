import { SEOUL_GRID_MAP_CONFIG, SEOUL_GRID_NUMBER_LETTERS } from "../config/seoulGridNumberConfig";

type SeoulGridMapPoint = {
  u: number;
  v: number;
};

type SeoulGridMapSize = {
  depth: number;
  width: number;
};

export type SeoulGridCell = {
  column: number;
  row: number;
};

export function toSeoulGridCell(point: SeoulGridMapPoint, size: SeoulGridMapSize): SeoulGridCell {
  const { columns, rows } = SEOUL_GRID_MAP_CONFIG;
  const column = Math.floor(((point.u + size.width / 2) / size.width) * columns);
  const row = Math.floor(((size.depth / 2 - point.v) / size.depth) * rows);

  return {
    column: clamp(column, 0, columns - 1),
    row: clamp(row, 0, rows - 1),
  };
}

export function getSeoulGridCells(): readonly SeoulGridCell[] {
  const { columns, rows } = SEOUL_GRID_MAP_CONFIG;

  return Array.from({ length: rows * columns }, (_, index) => ({
    column: index % columns,
    row: Math.floor(index / columns),
  }));
}

export function getSeoulGridCellDistrictId({ column, row }: SeoulGridCell): number | null {
  const encoded = SEOUL_GRID_MAP_CONFIG.districtCellRows[row]?.[column];

  if (!encoded || encoded === "-") {
    return null;
  }

  return Number.parseInt(encoded, 36);
}

export function isSeoulGridCellValid(cell: SeoulGridCell): boolean {
  return getSeoulGridCellDistrictId(cell) !== null;
}

export function toSeoulGridCellKm({ column, row }: SeoulGridCell): {
  eastKm: number;
  northKm: number;
} {
  const { columns, originKm, rows } = SEOUL_GRID_MAP_CONFIG;

  return {
    eastKm: originKm.x + clamp(column, 0, columns - 1),
    northKm: originKm.y + (rows - 1 - clamp(row, 0, rows - 1)),
  };
}

export function toSeoulGridNumber(cell: SeoulGridCell): string {
  const { eastKm, northKm } = toSeoulGridCellKm(cell);

  return `${toGridLetter(eastKm)}${toGridLetter(northKm)}${toGridDigits(eastKm)}${toGridDigits(northKm)}`;
}

function toGridLetter(km: number): string {
  return SEOUL_GRID_NUMBER_LETTERS[Math.floor(km / 100)] ?? "";
}

function toGridDigits(km: number): string {
  return String(Math.floor(km) % 100).padStart(2, "0");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
