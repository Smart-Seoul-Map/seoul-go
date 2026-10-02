import { getSeoulGridCells, isSeoulGridCellValid, toSeoulGridCellKm } from "./seoulGridNumber";
import type { SeoulGridCell } from "./seoulGridNumber";

const NUMBER_MODULO = 100;

export function isSeoulGridCellOnNumberLine(
  cell: SeoulGridCell,
  numbers: readonly number[]
): boolean {
  const { eastKm, northKm } = toSeoulGridCellKm(cell);

  return numbers.some(
    (number) => eastKm % NUMBER_MODULO === number || northKm % NUMBER_MODULO === number
  );
}

export function isSeoulGridCellSelectable(
  cell: SeoulGridCell,
  numbers: readonly number[]
): boolean {
  return isSeoulGridCellValid(cell) && isSeoulGridCellOnNumberLine(cell, numbers);
}

export function getSeoulGridSelectableCells(numbers: readonly number[]): readonly SeoulGridCell[] {
  return getSeoulGridCells().filter((cell) => isSeoulGridCellSelectable(cell, numbers));
}
