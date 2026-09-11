import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { isSeoulGridCellValid } from "./seoulGridNumber";
import type { SeoulGridCell } from "./seoulGridNumber";

export function getSeoulGridValidCells(): readonly SeoulGridCell[] {
  const { columns, districtCellRows } = SEOUL_GRID_MAP_CONFIG;

  return districtCellRows.flatMap((_, row) =>
    Array.from({ length: columns }, (__, column) => ({ column, row })).filter(isSeoulGridCellValid)
  );
}

export function pickRandomSeoulGridCell(random: () => number = Math.random): SeoulGridCell | null {
  const cells = getSeoulGridValidCells();

  if (cells.length === 0) {
    return null;
  }

  const index = Math.min(Math.floor(random() * cells.length), cells.length - 1);

  return cells[index];
}
