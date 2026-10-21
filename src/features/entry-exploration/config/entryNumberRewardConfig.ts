import type { EntryExplorationPlaceId } from "../domain/entryEditionPlace";

export const ENTRY_GRID_NUMBER_REQUIRED_MESSAGE = "장소를 방문해 번호를 먼저 획득해 주세요";
export const ENTRY_NUMBER_REWARD_TOAST_MESSAGE = "번호를 추가했어요";
export const ENTRY_NUMBER_REWARD_TOAST_ACTION_LABEL = "다트게임하기";

export function isEntryNumberRewardPlaceId(value: unknown): value is EntryExplorationPlaceId {
  return typeof value === "string" && /^smart-seoul:\d+:\d{2}_edition25_\d+$/.test(value);
}
