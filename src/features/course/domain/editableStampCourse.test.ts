import { describe, expect, test } from "vitest";

import type { SavedStampCoursePlace } from "./stampCourse";
import {
  createEditableStampCourse,
  hasEditableStampCourseChanges,
  resetEditableStampCourse,
} from "./editableStampCourse";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

function createPlace(id: string): SavedStampCoursePlace {
  return {
    addedAt: ADDED_AT,
    id,
    name: `${id} place`,
    position: {
      lat: 37.5547,
      lng: 126.9706,
    },
    themeId: "100032",
  };
}

describe("editableStampCourse", () => {
  test("copies saved course places into an editable course", () => {
    const savedPlaces = [createPlace("place-1")];

    const editableCourse = createEditableStampCourse(savedPlaces);

    expect(editableCourse.originalPlaces).toEqual(savedPlaces);
    expect(editableCourse.places).toEqual(savedPlaces);
    expect(editableCourse.originalPlaces).not.toBe(savedPlaces);
    expect(editableCourse.places).not.toBe(savedPlaces);
  });

  test("treats a newly created editable course as unchanged", () => {
    const editableCourse = createEditableStampCourse([
      createPlace("place-1"),
      createPlace("place-2"),
    ]);

    expect(hasEditableStampCourseChanges(editableCourse)).toBe(false);
  });

  test("treats removed or reordered places as changed", () => {
    const firstPlace = createPlace("place-1");
    const secondPlace = createPlace("place-2");

    expect(
      hasEditableStampCourseChanges({
        originalPlaces: [firstPlace, secondPlace],
        places: [secondPlace],
      })
    ).toBe(true);
    expect(
      hasEditableStampCourseChanges({
        originalPlaces: [firstPlace, secondPlace],
        places: [secondPlace, firstPlace],
      })
    ).toBe(true);
  });

  test("resets editable course places to original saved order", () => {
    const firstPlace = createPlace("place-1");
    const secondPlace = createPlace("place-2");

    const editableCourse = resetEditableStampCourse({
      originalPlaces: [firstPlace, secondPlace],
      places: [secondPlace],
    });

    expect(editableCourse).toEqual({
      originalPlaces: [firstPlace, secondPlace],
      places: [firstPlace, secondPlace],
    });
    expect(hasEditableStampCourseChanges(editableCourse)).toBe(false);
  });
});
