import { useStore } from "zustand";

import { createVisitedPlaceStore, type VisitedPlaceStoreState } from "./visitedPlaceStore";

export const visitedPlaceStore = createVisitedPlaceStore();

export function useVisitedPlaceStore<T>(selector: (state: VisitedPlaceStoreState) => T): T {
  return useStore(visitedPlaceStore, selector);
}
