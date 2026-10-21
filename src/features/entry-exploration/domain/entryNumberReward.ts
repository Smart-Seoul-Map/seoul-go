import type { EntryEditionPlace } from "./entryEditionPlace";
import { toSeoulGridCellFromGeoPoint } from "./seoulGridCoordinates";
import { toSeoulGridCellKm } from "./seoulGridNumber";

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
