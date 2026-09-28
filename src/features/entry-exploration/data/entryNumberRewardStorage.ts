import { isEntryNumberRewardPlaceId } from "../config/entryNumberRewardConfig";
import {
  ENTRY_NUMBER_MIN,
  ENTRY_NUMBER_MAX,
  MAX_ENTRY_NUMBER_REWARDS,
  type EntryNumberReward,
} from "../domain/entryNumberReward";

export const ENTRY_NUMBER_REWARD_STORAGE_KEY = "seoul-go:entry-number-rewards:v1";
export type EntryNumberRewardStorage = Pick<Storage, "getItem" | "setItem">;

export function loadEntryNumberRewards(
  storage: EntryNumberRewardStorage | null = getBrowserStorage()
): readonly EntryNumberReward[] {
  try {
    const raw = storage?.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY);
    const payload: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(payload) || payload.version !== 1 || !Array.isArray(payload.rewards)) return [];
    const rewards: EntryNumberReward[] = [];
    for (const candidate of payload.rewards) {
      if (
        !isReward(candidate) ||
        rewards.some(
          (reward) => reward.placeId === candidate.placeId || reward.number === candidate.number
        )
      )
        continue;
      rewards.push({
        placeId: candidate.placeId,
        number: candidate.number,
        revealed: candidate.revealed,
      });
      if (rewards.length >= MAX_ENTRY_NUMBER_REWARDS) break;
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
    storage.setItem(ENTRY_NUMBER_REWARD_STORAGE_KEY, JSON.stringify({ version: 1, rewards }));
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
    typeof value.number === "number" &&
    Number.isInteger(value.number) &&
    value.number >= ENTRY_NUMBER_MIN &&
    value.number <= ENTRY_NUMBER_MAX &&
    typeof value.revealed === "boolean"
  );
}
