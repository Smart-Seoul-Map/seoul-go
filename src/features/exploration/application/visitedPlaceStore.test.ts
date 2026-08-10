import { describe, expect, test } from "vitest";

import {
  VISITED_PLACE_STORAGE_KEY,
  VISITED_PLACE_STORAGE_VERSION,
  type VisitedPlaceStorage,
} from "../data/visitedPlaceStorage";
import { createVisitedPlaceStore } from "./visitedPlaceStore";

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

function seedStorage(storage: VisitedPlaceStorage, placeIds: readonly string[]): void {
  storage.setItem(
    VISITED_PLACE_STORAGE_KEY,
    JSON.stringify({
      placeIds,
      version: VISITED_PLACE_STORAGE_VERSION,
    })
  );
}

function readSavedPlaceIds(storage: VisitedPlaceStorage): string[] {
  const rawPayload = storage.getItem(VISITED_PLACE_STORAGE_KEY);

  if (!rawPayload) {
    return [];
  }

  return JSON.parse(rawPayload).placeIds;
}

describe("createVisitedPlaceStore", () => {
  test("loads saved visited place ids as initial state", () => {
    const storage = createMemoryStorage();
    seedStorage(storage, ["place-1"]);

    const store = createVisitedPlaceStore({ storage });

    expect(store.getState().placeIds).toEqual(["place-1"]);
  });

  test("marks a place as visited and saves it", () => {
    const storage = createMemoryStorage();
    const store = createVisitedPlaceStore({ storage });

    const result = store.getState().visitPlace("place-1");

    expect(result.status).toBe("visited");
    expect(store.getState().placeIds).toEqual(["place-1"]);
    expect(readSavedPlaceIds(storage)).toEqual(["place-1"]);
  });

  test("does not save duplicated visits", () => {
    const storage = createMemoryStorage();
    seedStorage(storage, ["place-1"]);
    const store = createVisitedPlaceStore({ storage });

    const result = store.getState().visitPlace("place-1");

    expect(result.status).toBe("already-visited");
    expect(store.getState().placeIds).toEqual(["place-1"]);
    expect(readSavedPlaceIds(storage)).toEqual(["place-1"]);
  });

  test("clears visited places from state and storage", () => {
    const storage = createMemoryStorage();
    seedStorage(storage, ["place-1"]);
    const store = createVisitedPlaceStore({ storage });

    store.getState().clearVisitedPlaces();

    expect(store.getState().placeIds).toEqual([]);
    expect(storage.getItem(VISITED_PLACE_STORAGE_KEY)).toBeNull();
  });
});
