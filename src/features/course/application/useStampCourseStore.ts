import { useStore } from "zustand";

import { createStampCourseStore, type StampCourseStoreState } from "./stampCourseStore";

export const stampCourseStore = createStampCourseStore();

export function useStampCourseStore<T>(selector: (state: StampCourseStoreState) => T): T {
  return useStore(stampCourseStore, selector);
}
