import { describe, expect, test } from "vitest";

import type { SavedStampCoursePlace } from "./stampCourse";
import { createKakaoWalkRouteUrl } from "./stampCourseKakaoWalkUrl";

const ADDED_AT = "2026-07-31T00:00:00.000Z";

function createPlace(
  id: string,
  name: string,
  position = {
    lat: 37.5547,
    lng: 126.9706,
  }
): SavedStampCoursePlace {
  return {
    addedAt: ADDED_AT,
    id,
    name,
    position,
    themeId: "100032",
  };
}

describe("createKakaoWalkRouteUrl", () => {
  test("코스 장소 순서를 유지해 카카오 도보 길찾기 URL을 만든다", () => {
    const result = createKakaoWalkRouteUrl([
      createPlace("place-1", "서울역", { lat: 37.5547, lng: 126.9706 }),
      createPlace("place-2", "남산타워", { lat: 37.5512, lng: 126.9882 }),
      createPlace("place-3", "명동성당", { lat: 37.5634, lng: 126.9873 }),
    ]);

    expect(result).toEqual({
      status: "created",
      url: `https://map.kakao.com/link/by/walk/${encodeURIComponent(
        "서울역"
      )},37.5547,126.9706/${encodeURIComponent("남산타워")},37.5512,126.9882/${encodeURIComponent(
        "명동성당"
      )},37.5634,126.9873`,
    });
  });

  test("장소가 2개 미만이면 URL을 만들지 않는다", () => {
    const result = createKakaoWalkRouteUrl([createPlace("place-1", "서울역")]);

    expect(result).toEqual({
      status: "not-enough-places",
      url: null,
    });
  });

  test("장소가 최대 슬롯 수를 넘으면 URL을 만들지 않는다", () => {
    const result = createKakaoWalkRouteUrl([
      createPlace("place-1", "서울역"),
      createPlace("place-2", "남산타워"),
      createPlace("place-3", "명동성당"),
      createPlace("place-4", "덕수궁"),
      createPlace("place-5", "서울광장"),
      createPlace("place-6", "청계천"),
      createPlace("place-7", "광화문"),
    ]);

    expect(result).toEqual({
      status: "too-many-places",
      url: null,
    });
  });

  test("장소명이나 좌표가 유효하지 않으면 URL을 만들지 않는다", () => {
    const result = createKakaoWalkRouteUrl([
      createPlace("place-1", "서울역"),
      createPlace("place-2", "", { lat: Number.NaN, lng: 126.9882 }),
    ]);

    expect(result).toEqual({
      status: "invalid-place",
      url: null,
    });
  });
});
