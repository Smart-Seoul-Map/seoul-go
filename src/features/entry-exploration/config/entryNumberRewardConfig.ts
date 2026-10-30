import type { EntryExplorationPlaceId } from "../domain/entryEditionPlace";

export function isEntryNumberRewardPlaceId(value: unknown): value is EntryExplorationPlaceId {
  return typeof value === "string" && /^smart-seoul:\d+:\d{2}_edition25_\d+$/.test(value);
}
