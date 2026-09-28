import type { EntryExplorationPlaceId } from "./entryExplorationPlace";

export const ENTRY_NUMBER_REWARD_PLACE_IDS = [
  "hanok",
  "tower",
] as const satisfies readonly EntryExplorationPlaceId[];

export function isEntryNumberRewardPlaceId(value: unknown): value is EntryExplorationPlaceId {
  return ENTRY_NUMBER_REWARD_PLACE_IDS.some((placeId) => placeId === value);
}
