import { describe, expect, test } from "vitest";

import {
  addStampCoursePlace,
  MAX_STAMP_COURSE_PLACES,
  removeStampCoursePlace,
  reorderStampCoursePlaces,
  restoreRemovedStampCoursePlace,
  type SavedStampCoursePlace,
  type StampCoursePlaceInput,
} from "./stampCourse";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

describe("stamp course domain", () => {
  test("adds a valid place to the end of the course", () => {
    const result = addStampCoursePlace([createSavedPlace("place-1")], createPlaceInput("place-2"), {
      addedAt: ADDED_AT,
    });

    expect(result.status).toBe("added");
    expect(result.places.map((place) => place.id)).toEqual(["place-1", "place-2"]);
    expect(result.places.at(-1)?.addedAt).toBe(ADDED_AT);
  });

  test("rejects a place that already exists in the course", () => {
    const places = [createSavedPlace("place-1")];
    const result = addStampCoursePlace(places, createPlaceInput("place-1"), { addedAt: ADDED_AT });

    expect(result.status).toBe("duplicate");
    expect(result.places).toEqual(places);
  });

  test("rejects a place when the course is full", () => {
    const places = Array.from({ length: MAX_STAMP_COURSE_PLACES }, (_, index) =>
      createSavedPlace(`place-${index + 1}`)
    );
    const result = addStampCoursePlace(places, createPlaceInput("place-extra"), {
      addedAt: ADDED_AT,
    });

    expect(result.status).toBe("full");
    expect(result.places).toEqual(places);
  });

  test("rejects a place without valid coordinates", () => {
    const result = addStampCoursePlace(
      [],
      createPlaceInput("place-1", { lat: Number.NaN, lng: 126.9 }),
      { addedAt: ADDED_AT }
    );

    expect(result.status).toBe("invalid-place");
    expect(result.places).toEqual([]);
  });

  test("removes a place and returns information needed for undo", () => {
    const places = [createSavedPlace("place-1"), createSavedPlace("place-2")];
    const result = removeStampCoursePlace(places, "place-1");

    expect(result.status).toBe("removed");
    expect(result.places.map((place) => place.id)).toEqual(["place-2"]);
    expect(result.removedPlace).toEqual({ index: 0, place: places[0] });
  });

  test("restores a removed place to its original index", () => {
    const place1 = createSavedPlace("place-1");
    const place2 = createSavedPlace("place-2");
    const result = restoreRemovedStampCoursePlace([place2], { index: 0, place: place1 });

    expect(result.status).toBe("restored");
    expect(result.places).toEqual([place1, place2]);
  });

  test("moves a place to another filled position", () => {
    const places = [
      createSavedPlace("place-1"),
      createSavedPlace("place-2"),
      createSavedPlace("place-3"),
    ];
    const result = reorderStampCoursePlaces(places, { fromIndex: 0, toIndex: 2 });

    expect(result.status).toBe("reordered");
    expect(result.places.map((place) => place.id)).toEqual(["place-2", "place-3", "place-1"]);
  });

  test("keeps the course unchanged when a reorder target is outside filled slots", () => {
    const places = [createSavedPlace("place-1"), createSavedPlace("place-2")];
    const result = reorderStampCoursePlaces(places, {
      fromIndex: 0,
      toIndex: MAX_STAMP_COURSE_PLACES - 1,
    });

    expect(result.status).toBe("skipped");
    expect(result.places).toEqual(places);
  });
});

function createPlaceInput(
  id: string,
  position = { lat: 37.5665, lng: 126.978 }
): StampCoursePlaceInput {
  return {
    id,
    name: `Place ${id}`,
    position,
    themeId: "100032",
  };
}

function createSavedPlace(id: string): SavedStampCoursePlace {
  return {
    ...createPlaceInput(id),
    addedAt: ADDED_AT,
  };
}
