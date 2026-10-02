import { beforeEach, describe, expect, test } from "vitest";

import { createEntryNumberRewardStore } from "./entryNumberRewardStore";
import { loadEntryNumberRewards } from "../data/entryNumberRewardStorage";

beforeEach(() => sessionStorage.clear());

describe("entry reward store", () => {
  test("allows ten edition places but never an eleventh place or an old example ID", () => {
    const store = createEntryNumberRewardStore({ storage: null, random: () => 0 });
    for (let index = 1; index <= 11; index += 1) {
      store.getState().visitPlace(`smart-seoul:1786321258890:25_edition25_${index}`);
    }
    expect(store.getState().rewards).toHaveLength(10);
    expect(new Set(store.getState().rewards.map((reward) => reward.number)).size).toBe(10);
    expect(
      createEntryNumberRewardStore({ storage: null }).getState().visitPlace("hanok")
    ).toBeNull();
  });
  test("returns and persists only a newly granted reward, restoring without redrawing", () => {
    const store = createEntryNumberRewardStore({ random: () => 0 });
    expect(store.getState().visitPlace("smart-seoul:1786321258890:25_edition25_21")).toEqual({
      placeId: "smart-seoul:1786321258890:25_edition25_21",
      number: 36,
    });
    expect(loadEntryNumberRewards()).toEqual([
      { placeId: "smart-seoul:1786321258890:25_edition25_21", number: 36 },
    ]);
    const restored = createEntryNumberRewardStore({ random: () => 0.99 });
    expect(restored.getState().visitPlace("smart-seoul:1786321258890:25_edition25_21")).toBeNull();
    expect(restored.getState().rewards).toEqual(store.getState().rewards);
    expect(loadEntryNumberRewards()).toEqual([
      { placeId: "smart-seoul:1786321258890:25_edition25_21", number: 36 },
    ]);
  });

  test("grants one distinct reward per configured place", () => {
    const store = createEntryNumberRewardStore({ random: () => 0 });
    store.getState().visitPlace("smart-seoul:1786321258890:25_edition25_21");
    store.getState().visitPlace("smart-seoul:1786321258890:25_edition25_21");
    store.getState().visitPlace("smart-seoul:1786321258890:26_edition25_21");
    expect(store.getState().rewards.map(({ number }) => number)).toEqual([36, 37]);
  });

  test("keeps in-memory rewards after storage failures without throwing or granting duplicates", () => {
    const storage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const store = createEntryNumberRewardStore({ storage, random: () => 0 });
    store.getState().visitPlace("smart-seoul:1786321258890:25_edition25_21");
    store.getState().visitPlace("smart-seoul:1786321258890:25_edition25_21");
    expect(store.getState().rewards).toEqual([
      { placeId: "smart-seoul:1786321258890:25_edition25_21", number: 36 },
    ]);
  });
});
