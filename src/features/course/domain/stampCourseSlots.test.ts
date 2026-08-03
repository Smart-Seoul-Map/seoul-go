import { describe, expect, test } from "vitest";

import type { SavedStampCoursePlace } from "./stampCourse";
import { createStampCourseSlots } from "./stampCourseSlots";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

function createPlace(id: string): SavedStampCoursePlace {
  return {
    addedAt: ADDED_AT,
    id,
    name: `${id} 장소`,
    position: {
      lat: 37.5547,
      lng: 126.9706,
    },
    themeId: "100032",
  };
}

describe("createStampCourseSlots", () => {
  test("저장된 장소와 빈 칸을 합쳐 최대 6개 슬롯을 만든다", () => {
    const place = createPlace("place-1");

    const slots = createStampCourseSlots([place]);

    expect(slots).toHaveLength(6);
    expect(slots[0]).toEqual({
      index: 0,
      place,
      status: "filled",
    });
    expect(slots.slice(1)).toEqual([
      { index: 1, place: null, status: "empty" },
      { index: 2, place: null, status: "empty" },
      { index: 3, place: null, status: "empty" },
      { index: 4, place: null, status: "empty" },
      { index: 5, place: null, status: "empty" },
    ]);
  });

  test("최대 슬롯 수보다 많은 장소는 슬롯에 포함하지 않는다", () => {
    const slots = createStampCourseSlots([
      createPlace("place-1"),
      createPlace("place-2"),
      createPlace("place-3"),
      createPlace("place-4"),
      createPlace("place-5"),
      createPlace("place-6"),
      createPlace("place-7"),
    ]);

    expect(slots).toHaveLength(6);
    expect(slots.map((slot) => slot.place?.id ?? null)).toEqual([
      "place-1",
      "place-2",
      "place-3",
      "place-4",
      "place-5",
      "place-6",
    ]);
  });
});
