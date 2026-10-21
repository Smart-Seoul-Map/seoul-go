import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  ENTRY_NUMBER_REWARD_STORAGE_KEY,
  loadEntryNumberRewards,
  saveEntryNumberRewards,
} from "./entryNumberRewardStorage";
import type { EntryNumberReward } from "../domain/entryNumberReward";

const LEGACY_STORAGE_KEY = "seoul-go:entry-number-rewards:v1";

const HAEBANGCHON: EntryNumberReward = {
  placeId: "smart-seoul:1786321258890:25_edition25_21",
  placeName: "해방촌신흥시장",
  east: 54,
  north: 49,
};
const EULJIRO: EntryNumberReward = {
  placeId: "smart-seoul:1786321258890:26_edition25_24",
  placeName: "을지로 골목",
  east: 55,
  north: 52,
};
const SEOSUNRA: EntryNumberReward = {
  placeId: "smart-seoul:1786321258890:26_edition25_23",
  placeName: "서순라길",
  east: 55,
  north: 52,
};
const rewards = [HAEBANGCHON, EULJIRO];

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("entry reward session storage", () => {
  test("round trips place rewards only through sessionStorage under the v2 key", () => {
    expect(ENTRY_NUMBER_REWARD_STORAGE_KEY).toBe("seoul-go:entry-number-rewards:v2");
    expect(saveEntryNumberRewards(rewards)).toBe(true);
    expect(loadEntryNumberRewards()).toEqual(rewards);
    expect(JSON.parse(sessionStorage.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY)!)).toEqual({
      version: 2,
      rewards,
    });
    expect(localStorage.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY)).toBeNull();
  });

  test("keeps rewards from different places even when their numbers are the same", () => {
    saveEntryNumberRewards([EULJIRO, SEOSUNRA]);
    expect(loadEntryNumberRewards()).toEqual([EULJIRO, SEOSUNRA]);
  });

  test("discards random number rewards saved by the previous version", () => {
    sessionStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ version: 1, rewards: [{ placeId: HAEBANGCHON.placeId, number: 40 }] })
    );
    expect(loadEntryNumberRewards()).toEqual([]);

    sessionStorage.setItem(
      ENTRY_NUMBER_REWARD_STORAGE_KEY,
      JSON.stringify({ version: 1, rewards: [HAEBANGCHON] })
    );
    expect(loadEntryNumberRewards()).toEqual([]);
  });

  test("drops extra fields while restoring rewards", () => {
    sessionStorage.setItem(
      ENTRY_NUMBER_REWARD_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rewards: rewards.map((reward, index) => ({ ...reward, revealed: index === 0 })),
      })
    );
    expect(loadEntryNumberRewards()).toEqual(rewards);
  });

  test.each(["not json", "null", '{"rewards":[]}', '{"version":2,"rewards":{}}'])(
    "ignores malformed data: %s",
    (raw) => {
      sessionStorage.setItem(ENTRY_NUMBER_REWARD_STORAGE_KEY, raw);
      expect(loadEntryNumberRewards()).toEqual([]);
    }
  );

  test("filters invalid values and duplicate places without losing valid rewards", () => {
    const boundary = {
      placeId: "smart-seoul:1786321258890:25_edition25_1",
      placeName: "경계 번호 장소",
      east: 0,
      north: 99,
    };
    sessionStorage.setItem(
      ENTRY_NUMBER_REWARD_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        rewards: [
          HAEBANGCHON,
          { ...EULJIRO, placeId: HAEBANGCHON.placeId },
          { ...EULJIRO, placeId: "hanok" },
          { ...EULJIRO, placeId: "tower" },
          { ...EULJIRO, placeName: "" },
          { ...EULJIRO, placeName: "   " },
          { ...EULJIRO, placeName: 7 },
          { ...EULJIRO, east: 100 },
          { ...EULJIRO, north: -1 },
          { ...EULJIRO, east: 54.5 },
          { ...EULJIRO, north: "52" },
          { placeId: EULJIRO.placeId, number: 40 },
          null,
          EULJIRO,
          boundary,
        ],
      })
    );
    expect(loadEntryNumberRewards()).toEqual([HAEBANGCHON, EULJIRO, boundary]);
  });

  test("restores every saved place reward without a count limit", () => {
    const stored = Array.from({ length: 12 }, (_, index) => ({
      placeId: `smart-seoul:1786321258890:25_edition25_${index + 1}`,
      placeName: `장소 ${index + 1}`,
      east: 40 + index,
      north: 50,
    }));
    saveEntryNumberRewards(stored);
    expect(loadEntryNumberRewards()).toEqual(stored);
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
