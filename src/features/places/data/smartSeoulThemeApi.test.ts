import { describe, expect, test, vi } from "vitest";

import { SMART_SEOUL_PLACE_THEME_IDS } from "../config/placeThemeConfig";
import {
  buildSmartSeoulThemeContentsUrl,
  fetchSmartSeoulThemePlaces,
  getNearbySmartSeoulPlaces,
} from "./smartSeoulThemeApi";

describe("Smart Seoul theme API", () => {
  test("retains pagination metadata when later pages omit it", async () => {
    const pages: number[] = [];
    await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032"],
      requestJson: async (url) => {
        const page = Number(url.searchParams.get("page_no"));
        pages.push(page);
        return {
          header:
            page === 1
              ? { resultCode: "200", PAGE_COUNT: 3, TOTAL_COUNT: 3 }
              : { resultCode: "200" },
          body: [{ COT_CONTS_ID: `row-${page}` }],
        };
      },
    });
    expect(pages).toEqual([1, 2, 3]);
  });
  test("rejects changing total or page counts instead of trusting a shortened later page", async () => {
    await expect(
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032"],
        requestJson: async (url) => ({
          header: {
            resultCode: "200",
            PAGE_COUNT: url.searchParams.get("page_no") === "1" ? 3 : 2,
            TOTAL_COUNT: 3,
          },
          body: [{ COT_CONTS_ID: "row" }],
        }),
      })
    ).rejects.toThrow("incomplete");
  });
  test("rejects an empty terminal page when earlier pages promised more results", async () => {
    await expect(
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032"],
        requestJson: async (url) => ({
          header: { resultCode: "200", PAGE_COUNT: 2 },
          body: url.searchParams.get("page_no") === "1" ? [{ COT_CONTS_ID: "one" }] : [],
        }),
      })
    ).rejects.toThrow("incomplete");
  });
  test("shares the request budget across independent catalog and nearby queries", async () => {
    let active = 0;
    let peak = 0;
    const requestJson = async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 20));
      active--;
      return { header: { resultCode: "200", PAGE_COUNT: 1 }, body: [] };
    };
    await Promise.all([
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032", "100575", "1725252918740"],
        requestJson,
      }),
      fetchSmartSeoulThemePlaces({ apiKey: "KEY", themeIds: ["1786321258890"], requestJson }),
    ]);
    expect(peak).toBe(2);
  });
  test("starts at most two independent theme requests concurrently", async () => {
    let active = 0;
    let peak = 0;
    const release: (() => void)[] = [];
    const result = fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032", "100575", "1725252918740"],
      requestJson: async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise<void>((resolve) => release.push(resolve));
        active--;
        return { header: { resultCode: "200", PAGE_COUNT: 1 }, body: [] };
      },
    });
    await vi.waitFor(() => expect(release).toHaveLength(2));
    release[0]();
    release[1]();
    await vi.waitFor(() => expect(release).toHaveLength(3));
    release[2]();
    await result;
    expect(peak).toBe(2);
  });
  test("passes cancellation to HTTP and stops remaining pages", async () => {
    const controller = new AbortController();
    let requests = 0;
    await expect(
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032"],
        signal: controller.signal,
        requestJson: async (_url, options) => {
          expect(options?.signal).toBe(controller.signal);
          requests++;
          controller.abort();
          return { header: { resultCode: "200", PAGE_COUNT: 2 }, body: [] };
        },
      })
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(requests).toBe(1);
  });

  test("rejects a page cap instead of silently returning a partial result", async () => {
    await expect(
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032"],
        maxPages: 1,
        requestJson: async () => ({ header: { resultCode: "200", PAGE_COUNT: 2 }, body: [] }),
      })
    ).rejects.toThrow("incomplete");
  });

  test("uses total and page size when page count is absent", async () => {
    const pages: number[] = [];
    await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["100032"],
      requestJson: async (url) => {
        const page = Number(url.searchParams.get("page_no"));
        pages.push(page);
        return {
          header: { resultCode: "200", TOTAL_COUNT: 2, PAGE_SIZE: 1 },
          body: [
            {
              COT_THEME_ID: "100032",
              COT_CONTS_ID: String(page),
              COT_CONTS_NAME: "Place",
              COT_COORD_X: 127,
              COT_COORD_Y: 37,
            },
          ],
        };
      },
    });
    expect(pages).toEqual([1, 2]);
  });

  test("rejects malformed successful bodies", async () => {
    await expect(
      fetchSmartSeoulThemePlaces({
        apiKey: "KEY",
        themeIds: ["100032"],
        requestJson: async () => ({ header: { resultCode: "200" }, body: null }),
      })
    ).rejects.toThrow("body");
  });

  test("deduplicates nearby results and orders server distances across themes", async () => {
    const makeRow = (id: string, themeId: string, distance: unknown) => ({
      COT_CONTS_ID: id,
      COT_CONTS_NAME: id,
      COT_THEME_ID: themeId,
      COT_COORD_X: 127,
      COT_COORD_Y: 37,
      DIST: distance,
    });
    const results = await getNearbySmartSeoulPlaces({
      apiKey: "KEY",
      themeIds: ["100032", "100575"],
      searchArea: { center: { lat: 37, lng: 127 }, distanceMeters: 1000 },
      requestJson: async (url) => ({
        header: { resultCode: "200", PAGE_COUNT: 1 },
        body:
          url.searchParams.get("theme_id") === "100032"
            ? [
                makeRow("far", "100032", "0.02"),
                makeRow("missing", "100032", ""),
                makeRow("far", "100032", "0.02"),
              ]
            : [makeRow("near", "100575", "0.001"), makeRow("zero", "100575", 0)],
      }),
    });
    expect(results.map(({ place }) => place.name)).toEqual(["zero", "near", "far", "missing"]);
    expect(results.at(-1)?.distance).toBeNull();
  });

  test("loads later edition years across pages without merging different year IDs", async () => {
    const requestedPages: string[] = [];
    const rows = [
      { COT_CONTS_ID: "26_edition25_24", COT_VALUE_01: "Selected in 2026" },
      { COT_CONTS_ID: "27_edition25_24", COT_VALUE_01: "Selected in 2027" },
    ];
    const places = await fetchSmartSeoulThemePlaces({
      apiKey: "KEY",
      themeIds: ["1786321258890"],
      requestJson: async (url) => {
        const pageNo = url.searchParams.get("page_no") ?? "1";
        requestedPages.push(pageNo);

        return {
          header: { PAGE_COUNT: "2", TOTAL_COUNT: "2", resultCode: "200" },
          body: [
            {
              ...rows[Number(pageNo) - 1],
              COT_CONTS_NAME: "Edition place",
              COT_THEME_ID: "1786321258890",
              COT_COORD_X: 126.991821159,
              COT_COORD_Y: 37.566987659,
              COT_IMG_MAIN_URL: "https://example.com/edition.png",
            },
          ],
        };
      },
    });

    expect(requestedPages).toEqual(["1", "2"]);
    expect(places).toMatchObject([
      {
        id: "smart-seoul:1786321258890:26_edition25_24",
        selectionYear: 2026,
        description: "Selected in 2026",
      },
      {
        id: "smart-seoul:1786321258890:27_edition25_24",
        selectionYear: 2027,
        description: "Selected in 2027",
      },
    ]);
  });

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

  test("requests all supported themes for a selected station search area", async () => {
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

    expect(requestedUrls).toHaveLength(6);
    expect(requestedUrls.map((url) => url.searchParams.get("theme_id"))).toContain("1786321258890");
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
          PAGE_NO: "0",
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
