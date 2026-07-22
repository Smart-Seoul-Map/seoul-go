import { describe, expect, test } from "vitest";

import { buildSmartSeoulThemeContentsUrl, fetchSmartSeoulThemePlaces } from "./smartSeoulThemeApi";

describe("Smart Seoul 테마 API", () => {
  test("테마 콘텐츠 요청 URL을 상수화된 파라미터로 만든다", () => {
    const url = buildSmartSeoulThemeContentsUrl({
      apiKey: "KEY 123",
      pageNo: 2,
      themeIds: ["100032", "100575"],
    });

    expect(url.origin + url.pathname).toBe(
      "https://map.seoul.go.kr/openapi/v5/KEY%20123/public/themes/contents/ko"
    );
    expect(url.searchParams.get("page_size")).toBe("100");
    expect(url.searchParams.get("page_no")).toBe("2");
    expect(url.searchParams.get("coord_x")).toBe("126.978462379");
    expect(url.searchParams.get("coord_y")).toBe("37.566501314");
    expect(url.searchParams.get("distance")).toBe("50000");
    expect(url.searchParams.get("theme_id")).toBe("100032,100575");
  });

  test("페이지 응답을 요청해 정규화된 장소만 반환한다", async () => {
    const requestedUrls: string[] = [];
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032"],
      requestJson: async (url) => {
        requestedUrls.push(url.toString());
        return {
          header: {
            resultCode: "200",
            PAGE_COUNT: 1,
          },
          body: [
            {
              COT_THEME_ID: "100032",
              COT_CONTS_ID: "heritage-1",
              COT_CONTS_NAME: "서울도서관",
              COT_COORD_X: "126.97842",
              COT_COORD_Y: "37.56668",
            },
          ],
        };
      },
    });

    expect(requestedUrls).toHaveLength(1);
    expect(places).toHaveLength(1);
    expect(places[0]?.name).toBe("서울도서관");
  });

  test("자치구 이름이 일치하는 장소만 반환한다", async () => {
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      districtName: "강남구",
      themeIds: ["100032"],
      requestJson: async () => ({
        header: {
          resultCode: "200",
          PAGE_COUNT: 1,
        },
        body: [
          {
            COT_THEME_ID: "100032",
            COT_CONTS_ID: "gangnam-place",
            COT_CONTS_NAME: "강남 장소",
            COT_COORD_X: "127.047",
            COT_COORD_Y: "37.517",
            COT_GU_NAME: "강남구",
          },
          {
            COT_THEME_ID: "100032",
            COT_CONTS_ID: "seocho-place",
            COT_CONTS_NAME: "서초 장소",
            COT_COORD_X: "127.032",
            COT_COORD_Y: "37.483",
            COT_GU_NAME: "서초구",
          },
        ],
      }),
    });

    expect(places.map((place) => place.sourceContentId)).toEqual(["gangnam-place"]);
  });
});
