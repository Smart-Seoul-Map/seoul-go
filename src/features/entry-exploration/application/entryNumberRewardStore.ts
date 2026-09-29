import { createStore } from "zustand/vanilla";

import type { EntryExplorationPlaceId } from "../config/entryExplorationPlace";
import { isEntryNumberRewardPlaceId } from "../config/entryNumberRewardConfig";
import {
  loadEntryNumberRewards,
  saveEntryNumberRewards,
  type EntryNumberRewardStorage,
} from "../data/entryNumberRewardStorage";
import { grantEntryNumberReward, type EntryNumberReward } from "../domain/entryNumberReward";

export type EntryNumberRewardStoreState = {
  rewards: readonly EntryNumberReward[];
  visitPlace: (placeId: EntryExplorationPlaceId) => EntryNumberReward | null;
};

export function createEntryNumberRewardStore({
  storage,
  random = Math.random,
}: {
  storage?: EntryNumberRewardStorage | null;
  random?: () => number;
} = {}) {
  return createStore<EntryNumberRewardStoreState>()((set, get) => {
    return {
      rewards: loadEntryNumberRewards(storage),
      visitPlace: (placeId) => {
        if (!isEntryNumberRewardPlaceId(placeId)) return null;
        const previous = get().rewards;
        const rewards = grantEntryNumberReward(previous, placeId, random);
        if (rewards === previous) return null;
        saveEntryNumberRewards(rewards, storage);
        set({ rewards });
        return rewards[rewards.length - 1];
      },
    };
  });
}
