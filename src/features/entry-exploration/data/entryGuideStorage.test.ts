import { expect, test, vi } from "vitest";

import {
  ENTRY_GUIDE_SEEN_STORAGE_KEY,
  hasSeenEntryGuide,
  markEntryGuideSeen,
  type EntryGuideStorage,
} from "./entryGuideStorage";

function createMemoryStorage(): EntryGuideStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("remembers that the entry guide was shown", () => {
  const storage = createMemoryStorage();
  expect(hasSeenEntryGuide(storage)).toBe(false);

  markEntryGuideSeen(storage);

  expect(storage.getItem(ENTRY_GUIDE_SEEN_STORAGE_KEY)).toBe("1");
  expect(hasSeenEntryGuide(storage)).toBe(true);
});

test("treats unavailable storage as not seen without throwing", () => {
  const storage: EntryGuideStorage = {
    getItem: vi.fn(() => {
      throw new Error("blocked");
    }),
    setItem: vi.fn(() => {
      throw new Error("blocked");
    }),
  };

  expect(hasSeenEntryGuide(storage)).toBe(false);
  expect(() => markEntryGuideSeen(storage)).not.toThrow();
  expect(hasSeenEntryGuide(null)).toBe(false);
});
