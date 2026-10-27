import type { EntryEditionPlace } from "./entryEditionPlace";
import { toSeoulGridCellFromGeoPoint } from "./seoulGridCoordinates";
import { toSeoulGridCellKm, type SeoulGridCell } from "./seoulGridNumber";

export type EntryNumberReward = {
  placeId: string;
  placeName: string;
  east: number;
  north: number;
};

export type EntryNumberRewardPlace = Pick<EntryEditionPlace, "id" | "name" | "position">;

export type EntryNumberRewardRow = {
  key: string;
  placeName: string;
  number: number;
};

export type EntryNumberRewardCell = {
  cell: SeoulGridCell;
  placeId: string;
  placeName: string;
  selectionYear?: number;
};

const GRID_NUMBER_MODULO = 100;

export function createEntryNumberReward(place: EntryNumberRewardPlace): EntryNumberReward | null {
  const cell = toSeoulGridCellFromGeoPoint(place.position);

  if (!cell) {
    return null;
  }

  const { eastKm, northKm } = toSeoulGridCellKm(cell);

  return {
    placeId: place.id,
    placeName: place.name,
    east: eastKm % GRID_NUMBER_MODULO,
    north: northKm % GRID_NUMBER_MODULO,
  };
}

export function grantEntryNumberReward(
  rewards: readonly EntryNumberReward[],
  place: EntryNumberRewardPlace
): readonly EntryNumberReward[] {
  if (rewards.some((reward) => reward.placeId === place.id)) {
    return rewards;
  }

  const reward = createEntryNumberReward(place);

  return reward ? [...rewards, reward] : rewards;
}

export function getEntryNumberRewardRows(
  rewards: readonly EntryNumberReward[]
): readonly EntryNumberRewardRow[] {
  return rewards.flatMap(({ placeId, placeName, east, north }) => [
    { key: `${placeId}:east`, placeName, number: east },
    { key: `${placeId}:north`, placeName, number: north },
  ]);
}

export function getEntryDartNumbers(rewards: readonly EntryNumberReward[]): readonly number[] {
  return [...new Set(rewards.flatMap((reward) => [reward.east, reward.north]))];
}

// 번호 줄 칸 중 번호를 준 장소가 있는 칸만 고른다. 줄 밖 장소는 빠지고, 한 칸에는 먼저 얻은 장소만 둔다.
export function getEntryNumberRewardCells(
  rewards: readonly EntryNumberReward[],
  cells: readonly SeoulGridCell[],
  places: readonly Pick<EntryEditionPlace, "id" | "selectionYear">[]
): readonly EntryNumberRewardCell[] {
  const rewardCells: EntryNumberRewardCell[] = [];

  for (const reward of rewards) {
    const cell = cells.find((candidate) => isEntryNumberRewardCell(candidate, reward));

    if (!cell || rewardCells.some((rewardCell) => isSameSeoulGridCell(rewardCell.cell, cell))) {
      continue;
    }

    rewardCells.push({
      cell,
      placeId: reward.placeId,
      placeName: reward.placeName,
      selectionYear: places.find((place) => place.id === reward.placeId)?.selectionYear,
    });
  }

  return rewardCells;
}

function isEntryNumberRewardCell(cell: SeoulGridCell, reward: EntryNumberReward): boolean {
  const { eastKm, northKm } = toSeoulGridCellKm(cell);

  return (
    eastKm % GRID_NUMBER_MODULO === reward.east && northKm % GRID_NUMBER_MODULO === reward.north
  );
}

function isSameSeoulGridCell(left: SeoulGridCell, right: SeoulGridCell): boolean {
  return left.column === right.column && left.row === right.row;
}
