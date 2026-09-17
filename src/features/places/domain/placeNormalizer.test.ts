import { describe, expect, test } from "vitest";

import {
  normalizeSmartSeoulThemeContent,
  normalizeSmartSeoulThemeContentsResponse,
} from "./placeNormalizer";

describe("normalizeSmartSeoulThemeContent", () => {
  test("normalizes a valid Smart Seoul theme content row", () => {
    const place = normalizeSmartSeoulThemeContent({
      COT_ADDR_FULL_NEW: "Seoul Jung-gu",
      COT_CONTS_ID: "heritage-1",
      COT_CONTS_NAME: "<b>Library</b>&nbsp;",
      COT_COORD_X: "126.97842",
      COT_COORD_Y: "37.56668",
      COT_GU_NAME: "district-a",
      COT_IMG_MAIN_URL: "https://map.seoul.go.kr/library.jpg",
      COT_THEME_ID: "100032",
    });

    expect(place).toMatchObject({
      address: "Seoul Jung-gu",
      districtName: "district-a",
      id: "smart-seoul:100032:heritage-1",
      imageUrl: "/api/place-image?url=https%3A%2F%2Fmap.seoul.go.kr%2Flibrary.jpg",
      name: "Library",
      position: {
        lat: 37.56668,
        lng: 126.97842,
      },
      sourceContentId: "heritage-1",
      themeId: "100032",
    });
  });

  test("normalizes Smart Seoul relative image paths to proxied absolute URLs", () => {
    const slashRelativePlace = normalizeSmartSeoulThemeContent({
      COT_CONTS_ID: "soulspot-1",
      COT_CONTS_NAME: "Soul spot",
      COT_COORD_X: "126.9",
      COT_COORD_Y: "37.5",
      COT_IMG_MAIN_URL: "/smgis2/file/ucimgs/conts/100575/아다모스튜디오 (1).jpg",
      COT_THEME_ID: "100575",
    });
    const pathRelativePlace = normalizeSmartSeoulThemeContent({
      COT_CONTS_ID: "mulbitnaru-1",
      COT_CONTS_NAME: "Mulbitnaru",
      COT_COORD_X: "126.9",
      COT_COORD_Y: "37.5",
      COT_IMG_MAIN_URL: "smgis/ucimgs/conts/1777251935025/place.jpg",
      COT_THEME_ID: "1777251935025",
    });

    expect(slashRelativePlace?.imageUrl).toBe(
      "/api/place-image?url=https%3A%2F%2Fmap.seoul.go.kr%2Fsmgis2%2Ffile%2Fucimgs%2Fconts%2F100575%2F%25EC%2595%2584%25EB%258B%25A4%25EB%25AA%25A8%25EC%258A%25A4%25ED%258A%259C%25EB%2594%2594%25EC%2598%25A4%2520(1).jpg"
    );
    expect(pathRelativePlace?.imageUrl).toBe(
      "/api/place-image?url=https%3A%2F%2Fmap.seoul.go.kr%2Fsmgis%2Fucimgs%2Fconts%2F1777251935025%2Fplace.jpg"
    );
  });

  test("returns null for unsupported themes or rows missing required coordinates", () => {
    expect(
      normalizeSmartSeoulThemeContent({
        COT_CONTS_ID: "place-1",
        COT_CONTS_NAME: "Unknown place",
        COT_COORD_X: "126",
        COT_COORD_Y: "37",
        COT_THEME_ID: "unknown",
      })
    ).toBeNull();

    expect(
      normalizeSmartSeoulThemeContent({
        COT_CONTS_ID: "place-2",
        COT_CONTS_NAME: "Place without coordinates",
        COT_THEME_ID: "100032",
      })
    ).toBeNull();
  });

  test("keeps only valid places from response body", () => {
    const places = normalizeSmartSeoulThemeContentsResponse({
      body: [
        {
          COT_CONTS_ID: "old-store-1",
          COT_CONTS_NAME: "Old store",
          COT_COORD_X: "126.9",
          COT_COORD_Y: "37.5",
          COT_GU_NAME: "district-a",
          COT_THEME_ID: "100575",
        },
        {
          COT_CONTS_ID: "bad-store",
          COT_CONTS_NAME: "",
          COT_COORD_X: "126.9",
          COT_COORD_Y: "37.5",
          COT_THEME_ID: "100575",
        },
      ],
    });

    expect(places).toHaveLength(1);
    expect(places[0]?.name).toBe("Old store");
    expect(places[0]?.districtName).toBe("district-a");
  });
});
