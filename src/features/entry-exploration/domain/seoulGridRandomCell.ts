import { getSeoulGridCells, isSeoulGridCellValid } from "./seoulGridNumber";
import type { SeoulGridCell } from "./seoulGridNumber";

export function getSeoulGridValidCells(): readonly SeoulGridCell[] {
  return getSeoulGridCells().filter(isSeoulGridCellValid);
}

export function pickRandomSeoulGridCell(
  random: () => number = Math.random,
  cells: readonly SeoulGridCell[] = getSeoulGridValidCells()
): SeoulGridCell | null {
  if (cells.length === 0) {
    return null;
  }

  const index = Math.min(Math.floor(random() * cells.length), cells.length - 1);

  return cells[index];
}
