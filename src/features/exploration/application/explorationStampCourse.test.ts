import { describe, expect, test } from "vitest";

import {
  createStampCoursePlaceInputFromSelection,
  createStampCourseToastMessage,
} from "./explorationStampCourse";

const place = {
  id: "place-1",
  imageUrl: "https://example.com/place.jpg",
  markerColor: "#c92a2a",
  name: "Namsan Tower",
  position: {
    lat: 37.5,
    lng: 126.9,
  },
  themeId: "100032",
  themeName: "서울 미래유산",
};

describe("explorationStampCourse", () => {
  test("creates stamp course place input from selected place", () => {
    expect(createStampCoursePlaceInputFromSelection(place)).toEqual({
      id: "place-1",
      name: "Namsan Tower",
      position: {
        lat: 37.5,
        lng: 126.9,
      },
      themeId: "100032",
    });
  });

  test("creates toast messages by add place result status", () => {
    expect(createStampCourseToastMessage("added")).toEqual({
      durationMs: 2000,
      message: "스탬프 코스에 담았어요",
      status: "success",
    });
    expect(createStampCourseToastMessage("duplicate")).toEqual({
      durationMs: 2000,
      message: "이미 담긴 장소예요",
      status: "info",
    });
    expect(createStampCourseToastMessage("full")).toEqual({
      durationMs: 2000,
      message: "스탬프 코스는 최대 6개까지 담을 수 있어요",
      status: "error",
    });
    expect(createStampCourseToastMessage("invalid-place")).toEqual({
      durationMs: 2000,
      message: "장소 정보를 확인할 수 없어요",
      status: "error",
    });
  });
});
