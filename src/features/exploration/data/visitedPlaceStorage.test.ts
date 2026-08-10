import { describe, expect, test } from "vitest";

import {
  loadVisitedPlaceIds,
  saveVisitedPlaceIds,
  VISITED_PLACE_STORAGE_KEY,
  VISITED_PLACE_STORAGE_VERSION,
  type VisitedPlaceStorage,
} from "./visitedPlaceStorage";

function createMemoryStorage(): VisitedPlaceStorage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("visitedPlaceStorage", () => {
  test("loads saved visited place ids", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      VISITED_PLACE_STORAGE_KEY,
      JSON.stringify({
        placeIds: ["place-1", "place-2"],
        version: VISITED_PLACE_STORAGE_VERSION,
      })
    );

    expect(loadVisitedPlaceIds(storage)).toEqual(["place-1", "place-2"]);
  });

  test("filters invalid and duplicated ids while loading", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      VISITED_PLACE_STORAGE_KEY,
      JSON.stringify({
        placeIds: ["place-1", "", "place-1", 100, "place-2"],
        version: VISITED_PLACE_STORAGE_VERSION,
      })
    );

    expect(loadVisitedPlaceIds(storage)).toEqual(["place-1", "place-2"]);
  });

  test("saves visited place ids as versioned payload", () => {
    const storage = createMemoryStorage();

    saveVisitedPlaceIds(["place-1"], storage);

    expect(JSON.parse(storage.getItem(VISITED_PLACE_STORAGE_KEY) ?? "{}")).toEqual({
      placeIds: ["place-1"],
      version: VISITED_PLACE_STORAGE_VERSION,
    });
  });
});
