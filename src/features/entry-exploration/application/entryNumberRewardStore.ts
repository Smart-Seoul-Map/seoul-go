import { createStore } from "zustand/vanilla";

import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { isEntryNumberRewardPlaceId } from "../config/entryNumberRewardConfig";
import {
  loadEntryNumberRewards,
  saveEntryNumberRewards,
  type EntryNumberRewardStorage,
} from "../data/entryNumberRewardStorage";
import { grantEntryNumberReward, type EntryNumberReward } from "../domain/entryNumberReward";

export type EntryNumberRewardStoreState = {
  rewards: readonly EntryNumberReward[];
  visitPlace: (place: EntryEditionPlace) => EntryNumberReward | null;
};

export function createEntryNumberRewardStore({
  storage,
}: {
  storage?: EntryNumberRewardStorage | null;
} = {}) {
  return createStore<EntryNumberRewardStoreState>()((set, get) => {
    return {
      rewards: loadEntryNumberRewards(storage),
      visitPlace: (place) => {
        if (!isEntryNumberRewardPlaceId(place.id)) return null;
        const previous = get().rewards;
        const rewards = grantEntryNumberReward(previous, place);
        if (rewards === previous) return null;
        saveEntryNumberRewards(rewards, storage);
        set({ rewards });
        return rewards[rewards.length - 1];
      },
    };
  });
}
