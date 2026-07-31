import { describe, expect, test } from "vitest";

import type { SavedStampCoursePlace } from "./stampCourse";
import {
  decodeStampCourseSharePayload,
  encodeStampCourseSharePayload,
} from "./stampCourseSharePayload";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

function createPlace(id: string, name: string): SavedStampCoursePlace {
  return {
    addedAt: ADDED_AT,
    id,
    name,
    position: {
      lat: 37.5547,
      lng: 126.9706,
    },
    themeId: "100032",
  };
}

describe("stampCourseSharePayload", () => {
  test("저장 코스 장소를 공유 링크용 최소 payload로 인코딩하고 다시 복원한다", () => {
    const places = [createPlace("place-1", "서울역"), createPlace("place-2", "남산타워")];

    const encodeResult = encodeStampCourseSharePayload(places);

    expect(encodeResult.status).toBe("encoded");
    if (encodeResult.status !== "encoded") {
      throw new Error("share payload should be encoded");
    }

    const decodeResult = decodeStampCourseSharePayload(encodeResult.payload);

    expect(decodeResult).toEqual({
      places: [
        {
          id: "place-1",
          name: "서울역",
          position: {
            lat: 37.5547,
            lng: 126.9706,
          },
          themeId: "100032",
        },
        {
          id: "place-2",
          name: "남산타워",
          position: {
            lat: 37.5547,
            lng: 126.9706,
          },
          themeId: "100032",
        },
      ],
      status: "decoded",
    });
  });

  test("비어 있는 코스는 공유 payload를 만들지 않는다", () => {
    expect(encodeStampCourseSharePayload([])).toEqual({
      payload: null,
      status: "empty",
    });
  });

  test("최대 슬롯 수를 넘는 코스는 공유 payload를 만들지 않는다", () => {
    expect(
      encodeStampCourseSharePayload([
        createPlace("place-1", "서울역"),
        createPlace("place-2", "남산타워"),
        createPlace("place-3", "명동성당"),
        createPlace("place-4", "덕수궁"),
        createPlace("place-5", "서울광장"),
        createPlace("place-6", "청계천"),
        createPlace("place-7", "광화문"),
      ])
    ).toEqual({
      payload: null,
      status: "too-many-places",
    });
  });

  test("잘못된 공유 payload는 복원하지 않는다", () => {
    expect(decodeStampCourseSharePayload("not-json")).toEqual({
      places: [],
      status: "invalid-payload",
    });
  });
});
