import { describe, expect, test } from "vitest";

import type { SavedStampCoursePlace } from "../domain/stampCourse";
import {
  clearStampCoursePlaces,
  loadStampCoursePlaces,
  saveStampCoursePlaces,
  STAMP_COURSE_STORAGE_KEY,
  STAMP_COURSE_STORAGE_VERSION,
} from "./stampCourseStorage";

describe("stamp course storage", () => {
  test("saves places with a versioned payload", () => {
    const storage = createMemoryStorage();
    const places = [createSavedPlace("place-1")];

    saveStampCoursePlaces(places, storage);

    expect(JSON.parse(storage.getItem(STAMP_COURSE_STORAGE_KEY) ?? "")).toEqual({
      places,
      version: STAMP_COURSE_STORAGE_VERSION,
    });
  });

  test("loads saved places from a versioned payload", () => {
    const storage = createMemoryStorage();
    const places = [createSavedPlace("place-1"), createSavedPlace("place-2")];
    storage.setItem(
      STAMP_COURSE_STORAGE_KEY,
      JSON.stringify({ places, version: STAMP_COURSE_STORAGE_VERSION })
    );

    expect(loadStampCoursePlaces(storage)).toEqual(places);
  });

  test("returns an empty course when storage is empty or unavailable", () => {
    expect(loadStampCoursePlaces(createMemoryStorage())).toEqual([]);
    expect(loadStampCoursePlaces(null)).toEqual([]);
  });

  test("returns an empty course when the stored payload is invalid", () => {
    const storage = createMemoryStorage();
    storage.setItem(STAMP_COURSE_STORAGE_KEY, "{invalid");

    expect(loadStampCoursePlaces(storage)).toEqual([]);
  });

  test("drops invalid saved places while loading", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STAMP_COURSE_STORAGE_KEY,
      JSON.stringify({
        places: [createSavedPlace("place-1"), { ...createSavedPlace("place-2"), position: null }],
        version: STAMP_COURSE_STORAGE_VERSION,
      })
    );

    expect(loadStampCoursePlaces(storage)).toEqual([createSavedPlace("place-1")]);
  });

  test("clears saved course data", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STAMP_COURSE_STORAGE_KEY,
      JSON.stringify({
        places: [createSavedPlace("place-1")],
        version: STAMP_COURSE_STORAGE_VERSION,
      })
    );

    clearStampCoursePlaces(storage);

    expect(storage.getItem(STAMP_COURSE_STORAGE_KEY)).toBeNull();
  });
});

function createSavedPlace(id: string): SavedStampCoursePlace {
  return {
    addedAt: "2026-07-31T00:00:00.000Z",
    id,
    name: `Place ${id}`,
    position: { lat: 37.5665, lng: 126.978 },
    themeId: "100032",
  };
}

function createMemoryStorage() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}
