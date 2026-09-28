import { createStore } from "zustand/vanilla";

import type { EntryExplorationPlaceId } from "../config/entryExplorationPlace";
import { isEntryNumberRewardPlaceId } from "../config/entryNumberRewardConfig";
import {
  loadEntryNumberRewards,
  saveEntryNumberRewards,
  type EntryNumberRewardStorage,
} from "../data/entryNumberRewardStorage";
import {
  grantEntryNumberReward,
  revealEntryNumberReward,
  type EntryNumberReward,
} from "../domain/entryNumberReward";

export type EntryNumberRewardStoreState = {
  rewards: readonly EntryNumberReward[];
  visitPlace: (placeId: EntryExplorationPlaceId) => void;
  revealReward: (placeId: string) => void;
};

export function createEntryNumberRewardStore({
  storage,
  random = Math.random,
}: {
  storage?: EntryNumberRewardStorage | null;
  random?: () => number;
} = {}) {
  return createStore<EntryNumberRewardStoreState>()((set, get) => {
    const updateRewards = (rewards: readonly EntryNumberReward[]) => {
      if (rewards === get().rewards) return;
      saveEntryNumberRewards(rewards, storage);
      set({ rewards });
    };
    return {
      rewards: loadEntryNumberRewards(storage),
      visitPlace: (placeId) => {
        if (isEntryNumberRewardPlaceId(placeId))
          updateRewards(grantEntryNumberReward(get().rewards, placeId, random));
      },
      revealReward: (placeId) => updateRewards(revealEntryNumberReward(get().rewards, placeId)),
    };
  });
}
