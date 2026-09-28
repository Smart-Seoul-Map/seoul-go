export type EntryNumberReward = { placeId: string; number: number; revealed: boolean };

export const ENTRY_NUMBER_MIN = 36;
export const ENTRY_NUMBER_MAX = 71;
export const MAX_ENTRY_NUMBER_REWARDS = 10;

export function grantEntryNumberReward(
  rewards: readonly EntryNumberReward[],
  placeId: string,
  random: () => number = Math.random
): readonly EntryNumberReward[] {
  if (
    rewards.some((reward) => reward.placeId === placeId) ||
    rewards.length >= MAX_ENTRY_NUMBER_REWARDS
  ) {
    return rewards;
  }
  const owned = new Set(rewards.map((reward) => reward.number));
  const available = Array.from(
    { length: ENTRY_NUMBER_MAX - ENTRY_NUMBER_MIN + 1 },
    (_, index) => ENTRY_NUMBER_MIN + index
  ).filter((number) => !owned.has(number));
  const number = available[Math.floor(random() * available.length)];

  return [...rewards, { placeId, number, revealed: false }];
}

export function revealEntryNumberReward(
  rewards: readonly EntryNumberReward[],
  placeId: string
): readonly EntryNumberReward[] {
  if (!rewards.some((reward) => reward.placeId === placeId && !reward.revealed)) return rewards;

  return rewards.map((reward) =>
    reward.placeId === placeId ? { ...reward, revealed: true } : reward
  );
}
