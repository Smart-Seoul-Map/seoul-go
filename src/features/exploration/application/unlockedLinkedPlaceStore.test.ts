import { describe, expect, test, vi } from "vitest";
import { createUnlockedLinkedPlaceStore } from "./unlockedLinkedPlaceStore";
import { UNLOCKED_LINKED_PLACE_STORAGE_KEY } from "../data/unlockedLinkedPlaceStorage";

const reference = { id: "edition-a", position: { lat: 37.5, lng: 127 } };

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("unlocked linked places", () => {
  test("restores unlocked IDs and coordinates without persisting API place details", () => {
    const storage = createStorage();
    const store = createUnlockedLinkedPlaceStore({ storage });
    const placeWithDetails = { ...reference, name: "Not persisted" };
    store.getState().unlockReferences([placeWithDetails]);
    const restored = createUnlockedLinkedPlaceStore({ storage });
    expect(restored.getState().references).toEqual([reference]);
    expect(JSON.parse(storage.getItem(UNLOCKED_LINKED_PLACE_STORAGE_KEY)!)).toEqual({
      version: 1,
      references: [reference],
    });
  });

  test("keeps previous unlocks when courses disappear and does not rewrite duplicates", () => {
    const storage = createStorage();
    const store = createUnlockedLinkedPlaceStore({ storage });
    store.getState().unlockReferences([reference]);
    const previous = store.getState().references;
    store.getState().unlockReferences([reference]);
    store.getState().unlockReferences([]);
    expect(store.getState().references).toBe(previous);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    store.getState().unlockReferences([{ ...reference, position: { lat: 38, lng: 127 } }]);
    expect(store.getState().references).toEqual([
      { ...reference, position: { lat: 38, lng: 127 } },
    ]);
  });

  test.each(["invalid JSON", '{"version":2,"references":[]}', "null"])(
    "ignores unreadable storage: %s",
    (payload) => {
      const storage = createStorage();
      storage.setItem(UNLOCKED_LINKED_PLACE_STORAGE_KEY, payload);
      expect(createUnlockedLinkedPlaceStore({ storage }).getState().references).toEqual([]);
    }
  );

  test("ignores invalid coordinates and duplicate saved IDs", () => {
    const storage = createStorage();
    storage.setItem(
      UNLOCKED_LINKED_PLACE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        references: [
          reference,
          reference,
          null,
          { id: "bad", position: { lat: 91, lng: 127 } },
          { id: "string", position: { lat: "37", lng: 127 } },
        ],
      })
    );
    expect(createUnlockedLinkedPlaceStore({ storage }).getState().references).toEqual([reference]);
  });

  test("storage failures leave exploration usable in memory", () => {
    const fail = () => {
      throw new Error("Storage unavailable");
    };
    const store = createUnlockedLinkedPlaceStore({ storage: { getItem: fail, setItem: fail } });
    expect(() => store.getState().unlockReferences([reference])).not.toThrow();
    expect(store.getState().references).toEqual([reference]);
  });
});
