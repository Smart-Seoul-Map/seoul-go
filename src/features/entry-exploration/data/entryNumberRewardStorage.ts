import { isEntryNumberRewardPlaceId } from "../config/entryNumberRewardConfig";
import type { EntryNumberReward } from "../domain/entryNumberReward";

export const ENTRY_NUMBER_REWARD_STORAGE_KEY = "seoul-go:entry-number-rewards:v2";
export type EntryNumberRewardStorage = Pick<Storage, "getItem" | "setItem">;

const ENTRY_NUMBER_REWARD_STORAGE_VERSION = 2;
const GRID_NUMBER_MIN = 0;
const GRID_NUMBER_MAX = 99;

export function loadEntryNumberRewards(
  storage: EntryNumberRewardStorage | null = getBrowserStorage()
): readonly EntryNumberReward[] {
  try {
    const raw = storage?.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY);
    const payload: unknown = raw ? JSON.parse(raw) : null;
    if (
      !isRecord(payload) ||
      payload.version !== ENTRY_NUMBER_REWARD_STORAGE_VERSION ||
      !Array.isArray(payload.rewards)
    )
      return [];
    const rewards: EntryNumberReward[] = [];
    for (const candidate of payload.rewards) {
      if (!isReward(candidate) || rewards.some((reward) => reward.placeId === candidate.placeId))
        continue;
      rewards.push({
        placeId: candidate.placeId,
        placeName: candidate.placeName,
        east: candidate.east,
        north: candidate.north,
      });
    }
    return rewards;
  } catch {
    return [];
  }
}

export function saveEntryNumberRewards(
  rewards: readonly EntryNumberReward[],
  storage: EntryNumberRewardStorage | null = getBrowserStorage()
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      ENTRY_NUMBER_REWARD_STORAGE_KEY,
      JSON.stringify({ version: ENTRY_NUMBER_REWARD_STORAGE_VERSION, rewards })
    );
    return true;
  } catch {
    return false;
  }
}

function getBrowserStorage(): EntryNumberRewardStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isReward(value: unknown): value is EntryNumberReward {
  return (
    isRecord(value) &&
    isEntryNumberRewardPlaceId(value.placeId) &&
    typeof value.placeName === "string" &&
    value.placeName.trim() !== "" &&
    isGridNumber(value.east) &&
    isGridNumber(value.north)
  );
}

function isGridNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= GRID_NUMBER_MIN &&
    value <= GRID_NUMBER_MAX
  );
}
