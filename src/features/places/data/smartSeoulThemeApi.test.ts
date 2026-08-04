import { describe, expect, test } from "vitest";

import { SMART_SEOUL_PLACE_THEME_IDS } from "../config/placeThemeConfig";
import { buildSmartSeoulThemeContentsUrl, fetchSmartSeoulThemePlaces } from "./smartSeoulThemeApi";

describe("Smart Seoul theme API", () => {
  test("builds theme contents request URL with required params", () => {
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

  test("builds theme contents request URL with a custom search area", () => {
    const url = buildSmartSeoulThemeContentsUrl({
      apiKey: "KEY",
      searchArea: {
        center: { lat: 37.5657, lng: 126.9769 },
        distanceMeters: 500,
      },
      themeIds: ["100032"],
    });

    expect(url.searchParams.get("coord_x")).toBe("126.9769");
    expect(url.searchParams.get("coord_y")).toBe("37.5657");
    expect(url.searchParams.get("distance")).toBe("500");
  });

  test("requests pages and returns normalized places", async () => {
    const requestedUrls: string[] = [];
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032"],
      requestJson: async (url) => {
        requestedUrls.push(url.toString());
        return {
          header: {
            PAGE_COUNT: 1,
            resultCode: "200",
          },
          body: [
            {
              COT_CONTS_ID: "heritage-1",
              COT_CONTS_NAME: "Library",
              COT_COORD_X: "126.97842",
              COT_COORD_Y: "37.56668",
              COT_GU_NAME: "district-a",
              COT_THEME_ID: "100032",
            },
          ],
        };
      },
    });

    expect(requestedUrls).toHaveLength(1);
    expect(places).toHaveLength(1);
    expect(places[0]?.name).toBe("Library");
    expect(places[0]?.districtName).toBe("district-a");
  });

  test("requests every page until the API page count", async () => {
    const requestedPageNumbers: string[] = [];
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032"],
      requestJson: async (url) => {
        const pageNo = url.searchParams.get("page_no") ?? "1";

        requestedPageNumbers.push(pageNo);

        return {
          header: {
            PAGE_COUNT: 3,
            resultCode: "200",
          },
          body: [
            {
              COT_CONTS_ID: `page-${pageNo}`,
              COT_CONTS_NAME: `Place ${pageNo}`,
              COT_COORD_X: "126.97842",
              COT_COORD_Y: "37.56668",
              COT_GU_NAME: "district-a",
              COT_THEME_ID: "100032",
            },
          ],
        };
      },
    });

    expect(requestedPageNumbers).toEqual(["1", "2", "3"]);
    expect(places.map((place) => place.sourceContentId)).toEqual(["page-1", "page-2", "page-3"]);
  });

  test("requests places with a custom search area", async () => {
    const requestedUrls: URL[] = [];

    await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      searchArea: {
        center: { lat: 37.5657, lng: 126.9769 },
        distanceMeters: 500,
      },
      themeIds: ["100032"],
      requestJson: async (url) => {
        requestedUrls.push(url);

        return {
          header: {
            PAGE_COUNT: 1,
            resultCode: "200",
          },
          body: [],
        };
      },
    });

    expect(requestedUrls[0]?.searchParams.get("coord_x")).toBe("126.9769");
    expect(requestedUrls[0]?.searchParams.get("coord_y")).toBe("37.5657");
    expect(requestedUrls[0]?.searchParams.get("distance")).toBe("500");
  });

  test("requests all five themes for a selected station search area", async () => {
    const requestedUrls: URL[] = [];

    await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      searchArea: {
        center: { lat: 37.564718, lng: 126.977108 },
        distanceMeters: 1000,
      },
      requestJson: async (url) => {
        requestedUrls.push(url);

        return {
          header: {
            PAGE_COUNT: 1,
            resultCode: "200",
          },
          body: [],
        };
      },
    });

    expect(requestedUrls).toHaveLength(5);
    expect(requestedUrls.map((url) => url.searchParams.get("theme_id"))).toEqual(
      SMART_SEOUL_PLACE_THEME_IDS
    );
    expect(requestedUrls.every((url) => url.searchParams.get("distance") === "1000")).toBe(true);
  });

  test("returns an empty list when the API returns no nearby places", async () => {
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      searchArea: {
        center: { lat: 37.5657, lng: 126.9769 },
        distanceMeters: 1,
      },
      themeIds: ["100032"],
      requestJson: async () => ({
        head: {
          DATA_COUNT: "0",
          PAGE_COUNT: "0",
          RETCODE: "100",
          TOTAL_COUNT: "0",
        },
        header: {
          DATA_COUNT: "0",
          PAGE_COUNT: "0",
          resultCode: "100",
          TOTAL_COUNT: "0",
        },
        body: [],
      }),
    });

    expect(places).toEqual([]);
  });

  test("throws when the API response has no result code", async () => {
    await expect(
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032"],
        requestJson: async () => ({
          body: [],
        }),
      })
    ).rejects.toThrow("Smart Seoul theme 100032 contents returned unknown");
  });

  test("does not filter rows by district while fetching source data", async () => {
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032"],
      requestJson: async () => ({
        header: {
          PAGE_COUNT: 1,
          resultCode: "200",
        },
        body: [
          {
            COT_CONTS_ID: "district-a-place",
            COT_CONTS_NAME: "District A place",
            COT_COORD_X: "127.047",
            COT_COORD_Y: "37.517",
            COT_GU_NAME: "district-a",
            COT_THEME_ID: "100032",
          },
          {
            COT_CONTS_ID: "district-b-place",
            COT_CONTS_NAME: "District B place",
            COT_COORD_X: "127.032",
            COT_COORD_Y: "37.483",
            COT_GU_NAME: "district-b",
            COT_THEME_ID: "100032",
          },
        ],
      }),
    });

    expect(places.map((place) => place.sourceContentId)).toEqual([
      "district-a-place",
      "district-b-place",
    ]);
  });
});
