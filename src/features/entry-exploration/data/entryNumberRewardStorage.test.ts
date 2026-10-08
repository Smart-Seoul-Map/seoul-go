import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  ENTRY_NUMBER_REWARD_STORAGE_KEY,
  loadEntryNumberRewards,
  saveEntryNumberRewards,
} from "./entryNumberRewardStorage";

const rewards = [
  { placeId: "tower", number: 57 },
  { placeId: "smart-seoul:1786321258890:25_edition25_24", number: 41 },
];

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("entry reward session storage", () => {
  test("restores legacy and API place IDs in the same session without losing numbers", () => {
    const mixed = [
      ...rewards,
      { placeId: "smart-seoul:1786321258890:25_edition25_12", number: 42 },
    ];
    saveEntryNumberRewards(mixed);
    expect(loadEntryNumberRewards()).toEqual(mixed);
  });
  test("round trips place numbers only through sessionStorage", () => {
    expect(saveEntryNumberRewards(rewards)).toBe(true);
    expect(loadEntryNumberRewards()).toEqual(rewards);
    expect(localStorage.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY)).toBeNull();
  });

  test("preserves legacy rewards while discarding the presentation flag", () => {
    sessionStorage.setItem(
      ENTRY_NUMBER_REWARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        rewards: rewards.map((reward, index) => ({ ...reward, revealed: index === 0 })),
      })
    );
    expect(loadEntryNumberRewards()).toEqual(rewards);
    saveEntryNumberRewards(loadEntryNumberRewards());
    expect(JSON.parse(sessionStorage.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY)!)).toEqual({
      version: 1,
      rewards,
    });
  });

  test.each(["not json", "null", '{"version":2,"rewards":[]}', '{"version":1,"rewards":{}}'])(
    "ignores malformed data: %s",
    (raw) => {
      sessionStorage.setItem(ENTRY_NUMBER_REWARD_STORAGE_KEY, raw);
      expect(loadEntryNumberRewards()).toEqual([]);
    }
  );

  test("filters invalid values and duplicate places or numbers without losing valid rewards", () => {
    sessionStorage.setItem(
      ENTRY_NUMBER_REWARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        rewards: [
          rewards[0],
          { placeId: "smart-seoul:1786321258890:25_edition25_24", number: 57 },
          { placeId: "tower", number: 55 },
          { placeId: "tower", number: 72 },
          { placeId: "tower", number: 36.5 },
          { placeId: "tower", number: "57" },
          { placeId: "missing", number: 58 },
          rewards[1],
        ],
      })
    );
    expect(loadEntryNumberRewards()).toEqual(rewards);
  });

  test("restores at most ten saved rewards and drops anything beyond", () => {
    const stored = Array.from({ length: 10 }, (_, index) => ({
      placeId: `smart-seoul:1786321258890:25_edition25_${index + 1}`,
      number: 36 + index,
    }));
    saveEntryNumberRewards([
      ...stored,
      { placeId: "smart-seoul:1786321258890:25_edition25_11", number: 46 },
    ]);
    expect(loadEntryNumberRewards()).toEqual(stored);
  });

  test("drops a hanok reward saved by an earlier version and keeps the other rewards", () => {
    saveEntryNumberRewards([{ placeId: "hanok", number: 40 }, ...rewards]);
    expect(loadEntryNumberRewards()).toEqual(rewards);
  });

  test("handles storage permission and quota errors", () => {
    const storage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(loadEntryNumberRewards(storage)).toEqual([]);
    expect(saveEntryNumberRewards(rewards, storage)).toBe(false);
    const getter = vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(loadEntryNumberRewards()).toEqual([]);
    expect(saveEntryNumberRewards(rewards)).toBe(false);
    getter.mockRestore();
  });
});
