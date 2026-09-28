import { beforeEach, describe, expect, test } from "vitest";

import { createEntryNumberRewardStore } from "./entryNumberRewardStore";
import { loadEntryNumberRewards } from "../data/entryNumberRewardStorage";

beforeEach(() => sessionStorage.clear());

describe("entry reward store", () => {
  test("persists the first visit before revealing it and restores it without redrawing", () => {
    const store = createEntryNumberRewardStore({ random: () => 0 });
    store.getState().visitPlace("hanok");
    expect(loadEntryNumberRewards()).toEqual([{ placeId: "hanok", number: 36, revealed: false }]);
    const restored = createEntryNumberRewardStore({ random: () => 0.99 });
    restored.getState().visitPlace("hanok");
    expect(restored.getState().rewards).toEqual(store.getState().rewards);
    restored.getState().revealReward("hanok");
    expect(loadEntryNumberRewards()).toEqual([{ placeId: "hanok", number: 36, revealed: true }]);
  });

  test("grants one distinct reward per configured place", () => {
    const store = createEntryNumberRewardStore({ random: () => 0 });
    store.getState().visitPlace("hanok");
    store.getState().visitPlace("hanok");
    store.getState().visitPlace("tower");
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
    store.getState().visitPlace("hanok");
    store.getState().revealReward("hanok");
    store.getState().visitPlace("hanok");
    expect(store.getState().rewards).toEqual([{ placeId: "hanok", number: 36, revealed: true }]);
  });
});
