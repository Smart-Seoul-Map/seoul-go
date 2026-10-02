import type { EntryExplorationPlaceId } from "../domain/entryEditionPlace";
import { ENTRY_HANOK_PLACE_ID } from "./entryHanokPlace";

export const ENTRY_GRID_NUMBER_REQUIRED_MESSAGE = "장소를 방문해 번호를 먼저 획득해 주세요";

export function isEntryNumberRewardPlaceId(value: unknown): value is EntryExplorationPlaceId {
  return (
    value === ENTRY_HANOK_PLACE_ID ||
    (typeof value === "string" && /^smart-seoul:\d+:\d{2}_edition25_\d+$/.test(value))
  );
}
