import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import type { StampCoursePlaceInput } from "../domain/stampCourse";
import { stampCourseStore, useStampCourseStore } from "./useStampCourseStore";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

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

describe("useStampCourseStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    stampCourseStore.setState({ places: [] });
  });

  test("selector로 필요한 코스 상태만 구독한다", () => {
    const { result } = renderHook(() => useStampCourseStore((state) => state.places.length));

    expect(result.current).toBe(0);

    act(() => {
      stampCourseStore.getState().addPlace(createPlaceInput("place-1"), {
        addedAt: ADDED_AT,
      });
    });

    expect(result.current).toBe(1);
  });
});
