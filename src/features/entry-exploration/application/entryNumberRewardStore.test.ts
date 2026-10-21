import { beforeEach, describe, expect, test } from "vitest";

import { createEntryNumberRewardStore } from "./entryNumberRewardStore";
import {
  ENTRY_NUMBER_REWARD_STORAGE_KEY,
  loadEntryNumberRewards,
  saveEntryNumberRewards,
} from "../data/entryNumberRewardStorage";
import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";

const [HAEBANGCHON, RIUM] = ENTRY_TEST_PLACES;
const HAEBANGCHON_REWARD = {
  placeId: HAEBANGCHON.id,
  placeName: "해방촌신흥시장",
  east: 54,
  north: 49,
};
const RIUM_REWARD = { placeId: RIUM.id, placeName: "리움미술관", east: 55, north: 48 };

beforeEach(() => sessionStorage.clear());

describe("entry reward store", () => {
  test("returns and saves a new place reward right away and restores it without granting again", () => {
    const store = createEntryNumberRewardStore();
    expect(store.getState().visitPlace(HAEBANGCHON)).toEqual(HAEBANGCHON_REWARD);
    expect(loadEntryNumberRewards()).toEqual([HAEBANGCHON_REWARD]);

    const restored = createEntryNumberRewardStore();
    expect(restored.getState().rewards).toEqual([HAEBANGCHON_REWARD]);
    expect(restored.getState().visitPlace(HAEBANGCHON)).toBeNull();
    expect(restored.getState().rewards).toEqual([HAEBANGCHON_REWARD]);
    expect(loadEntryNumberRewards()).toEqual([HAEBANGCHON_REWARD]);
  });

  test("grants one reward per place in visit order and ignores revisits", () => {
    const store = createEntryNumberRewardStore({ storage: null });
    expect(store.getState().visitPlace(HAEBANGCHON)).toEqual(HAEBANGCHON_REWARD);
    expect(store.getState().visitPlace(HAEBANGCHON)).toBeNull();
    expect(store.getState().visitPlace(RIUM)).toEqual(RIUM_REWARD);
    expect(store.getState().rewards).toEqual([HAEBANGCHON_REWARD, RIUM_REWARD]);
  });

  test("never rewards hanok or the removed tower ID", () => {
    const store = createEntryNumberRewardStore();
    expect(store.getState().visitPlace({ ...HAEBANGCHON, id: "hanok" })).toBeNull();
    expect(store.getState().visitPlace({ ...HAEBANGCHON, id: "tower" })).toBeNull();
    expect(store.getState().rewards).toEqual([]);
    expect(sessionStorage.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY)).toBeNull();
  });

  test("drops a hanok reward saved by an earlier version", () => {
    saveEntryNumberRewards([{ ...HAEBANGCHON_REWARD, placeId: "hanok" }, RIUM_REWARD]);
    const restored = createEntryNumberRewardStore();
    expect(restored.getState().rewards).toEqual([RIUM_REWARD]);
  });

  test("grants and saves nothing for a place outside the grid board", () => {
    const store = createEntryNumberRewardStore();
    expect(
      store.getState().visitPlace({ ...HAEBANGCHON, position: { lat: 35.1796, lng: 129.0756 } })
    ).toBeNull();
    expect(store.getState().rewards).toEqual([]);
    expect(sessionStorage.getItem(ENTRY_NUMBER_REWARD_STORAGE_KEY)).toBeNull();
  });

  test("rewards more places than the edition place count", () => {
    const store = createEntryNumberRewardStore({ storage: null });
    for (let index = 1; index <= 12; index += 1) {
      expect(
        store
          .getState()
          .visitPlace({ ...HAEBANGCHON, id: `smart-seoul:1786321258890:25_edition25_${index}` })
      ).not.toBeNull();
    }
    expect(store.getState().rewards).toHaveLength(12);
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
    const store = createEntryNumberRewardStore({ storage });
    store.getState().visitPlace(HAEBANGCHON);
    store.getState().visitPlace(HAEBANGCHON);
    expect(store.getState().rewards).toEqual([HAEBANGCHON_REWARD]);
  });
});
