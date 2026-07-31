import { describe, expect, test } from "vitest";

import type { SavedStampCoursePlace, StampCoursePlaceInput } from "../domain/stampCourse";
import {
  STAMP_COURSE_STORAGE_KEY,
  STAMP_COURSE_STORAGE_VERSION,
  type StampCourseStorage,
} from "../data/stampCourseStorage";
import { createStampCourseStore } from "./stampCourseStore";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

function createMemoryStorage(): StampCourseStorage {
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

function createPlaceInput(id: string): StampCoursePlaceInput {
  return {
    id,
    name: `${id} 장소`,
    position: {
      lat: 37.5,
      lng: 126.9,
    },
    themeId: "100032",
  };
}

function createSavedPlace(id: string): SavedStampCoursePlace {
  return {
    ...createPlaceInput(id),
    addedAt: ADDED_AT,
  };
}

function seedStorage(storage: StampCourseStorage, places: readonly SavedStampCoursePlace[]): void {
  storage.setItem(
    STAMP_COURSE_STORAGE_KEY,
    JSON.stringify({
      places,
      version: STAMP_COURSE_STORAGE_VERSION,
    })
  );
}

function readSavedPlaces(storage: StampCourseStorage): SavedStampCoursePlace[] {
  const raw = storage.getItem(STAMP_COURSE_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  return JSON.parse(raw).places;
}

describe("createStampCourseStore", () => {
  test("저장된 스탬프 코스 장소를 초기 상태로 불러온다", () => {
    const storage = createMemoryStorage();
    const savedPlaces = [createSavedPlace("place-1")];
    seedStorage(storage, savedPlaces);

    const store = createStampCourseStore({ storage });

    expect(store.getState().places).toEqual(savedPlaces);
  });

  test("장소를 담으면 상태와 저장소가 함께 갱신된다", () => {
    const storage = createMemoryStorage();
    const store = createStampCourseStore({
      now: () => ADDED_AT,
      storage,
    });

    const result = store.getState().addPlace(createPlaceInput("place-1"));

    expect(result.status).toBe("added");
    expect(store.getState().places).toEqual([createSavedPlace("place-1")]);
    expect(readSavedPlaces(storage)).toEqual([createSavedPlace("place-1")]);
  });

  test("중복 장소는 추가하지 않고 기존 상태를 유지한다", () => {
    const storage = createMemoryStorage();
    const savedPlaces = [createSavedPlace("place-1")];
    seedStorage(storage, savedPlaces);
    const store = createStampCourseStore({ storage });

    const result = store.getState().addPlace(createPlaceInput("place-1"));

    expect(result.status).toBe("duplicate");
    expect(store.getState().places).toEqual(savedPlaces);
    expect(readSavedPlaces(storage)).toEqual(savedPlaces);
  });

  test("장소를 삭제하고 삭제 정보를 사용해 원래 위치로 복구한다", () => {
    const storage = createMemoryStorage();
    const savedPlaces = [createSavedPlace("place-1"), createSavedPlace("place-2")];
    seedStorage(storage, savedPlaces);
    const store = createStampCourseStore({ storage });

    const removeResult = store.getState().removePlace("place-1");
    expect(removeResult.status).toBe("removed");
    expect(store.getState().places).toEqual([createSavedPlace("place-2")]);

    if (removeResult.status !== "removed") {
      throw new Error("remove result should include removed place");
    }

    const restoreResult = store.getState().restoreRemovedPlace(removeResult.removedPlace);

    expect(restoreResult.status).toBe("restored");
    expect(store.getState().places).toEqual(savedPlaces);
    expect(readSavedPlaces(storage)).toEqual(savedPlaces);
  });

  test("장소 순서를 바꾸면 상태와 저장소 순서가 함께 바뀐다", () => {
    const storage = createMemoryStorage();
    seedStorage(storage, [createSavedPlace("place-1"), createSavedPlace("place-2")]);
    const store = createStampCourseStore({ storage });

    const result = store.getState().reorderPlaces({
      fromIndex: 0,
      toIndex: 1,
    });

    expect(result.status).toBe("reordered");
    expect(store.getState().places.map((place) => place.id)).toEqual(["place-2", "place-1"]);
    expect(readSavedPlaces(storage).map((place) => place.id)).toEqual(["place-2", "place-1"]);
  });

  test("코스를 비우면 상태와 저장소가 함께 초기화된다", () => {
    const storage = createMemoryStorage();
    seedStorage(storage, [createSavedPlace("place-1")]);
    const store = createStampCourseStore({ storage });

    store.getState().clearPlaces();

    expect(store.getState().places).toEqual([]);
    expect(storage.getItem(STAMP_COURSE_STORAGE_KEY)).toBeNull();
  });
});
