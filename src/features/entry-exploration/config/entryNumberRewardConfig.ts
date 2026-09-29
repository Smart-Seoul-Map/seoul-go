import type { EntryExplorationPlaceId } from "./entryExplorationPlace";

export const ENTRY_GRID_NUMBER_REQUIRED_MESSAGE = "장소를 방문해 번호를 먼저 획득해 주세요";

export const ENTRY_NUMBER_REWARD_PLACE_IDS = [
  "hanok",
  "tower",
] as const satisfies readonly EntryExplorationPlaceId[];

export function isEntryNumberRewardPlaceId(value: unknown): value is EntryExplorationPlaceId {
  return ENTRY_NUMBER_REWARD_PLACE_IDS.some((placeId) => placeId === value);
}
