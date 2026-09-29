import { useStore } from "zustand";

import {
  createEntryNumberRewardStore,
  type EntryNumberRewardStoreState,
} from "./entryNumberRewardStore";

export const entryNumberRewardStore = createEntryNumberRewardStore();

export function useEntryNumberRewardStore<T>(
  selector: (state: EntryNumberRewardStoreState) => T
): T {
  return useStore(entryNumberRewardStore, selector);
}
