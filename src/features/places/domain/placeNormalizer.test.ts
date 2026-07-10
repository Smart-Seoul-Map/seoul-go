import { describe, expect, test } from "vitest";

import {
  normalizeSmartSeoulThemeContent,
  normalizeSmartSeoulThemeContentsResponse,
} from "./placeNormalizer";

describe("Smart Seoul 테마 장소 정규화", () => {
  test("HTML과 문자열 좌표가 섞인 응답을 앱 장소 타입으로 정규화한다", () => {
    const place = normalizeSmartSeoulThemeContent({
      COT_THEME_ID: "100032",
      COT_CONTS_ID: "heritage-1",
      COT_CONTS_NAME: "<b>서울도서관</b>&nbsp;",
      COT_COORD_X: "126.97842",
      COT_COORD_Y: "37.56668",
      COT_ADDR_FULL_NEW: "서울 중구 세종대로 110",
    });

    expect(place).toEqual({
      id: "smart-seoul:100032:heritage-1",
      sourceContentId: "heritage-1",
      name: "서울도서관",
      themeId: "100032",
      themeName: "서울 미래유산",
      address: "서울 중구 세종대로 110",
      position: {
        lng: 126.97842,
        lat: 37.56668,
      },
    });
  });

  test("승인되지 않은 테마나 필수 좌표가 없는 응답은 제외한다", () => {
    expect(
      normalizeSmartSeoulThemeContent({
        COT_THEME_ID: "unknown",
        COT_CONTS_ID: "place-1",
        COT_CONTS_NAME: "알 수 없는 장소",
        COT_COORD_X: "126",
        COT_COORD_Y: "37",
      })
    ).toBeNull();

    expect(
      normalizeSmartSeoulThemeContent({
        COT_THEME_ID: "100032",
        COT_CONTS_ID: "place-2",
        COT_CONTS_NAME: "좌표 없는 장소",
      })
    ).toBeNull();
  });

  test("응답 body 배열에서 유효한 장소만 남긴다", () => {
    const places = normalizeSmartSeoulThemeContentsResponse({
      body: [
        {
          COT_THEME_ID: "100575",
          COT_CONTS_ID: "old-store-1",
          COT_CONTS_NAME: "오래가게",
          COT_COORD_X: "126.9",
          COT_COORD_Y: "37.5",
        },
        {
          COT_THEME_ID: "100575",
          COT_CONTS_ID: "bad-store",
          COT_CONTS_NAME: "",
          COT_COORD_X: "126.9",
          COT_COORD_Y: "37.5",
        },
      ],
    });

    expect(places).toHaveLength(1);
    expect(places[0]?.name).toBe("오래가게");
  });
});
