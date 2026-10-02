import { useStore } from "zustand";
import {
  createUnlockedLinkedPlaceStore,
  type UnlockedLinkedPlaceStoreState,
} from "./unlockedLinkedPlaceStore";

export const unlockedLinkedPlaceStore = createUnlockedLinkedPlaceStore();

export function useUnlockedLinkedPlaceStore<T>(
  selector: (state: UnlockedLinkedPlaceStoreState) => T
): T {
  return useStore(unlockedLinkedPlaceStore, selector);
}
