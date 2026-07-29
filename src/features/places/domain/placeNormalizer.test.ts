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
      COT_THEME_ID: "100032",
    });

    expect(place).toMatchObject({
      address: "Seoul Jung-gu",
      districtName: "district-a",
      id: "smart-seoul:100032:heritage-1",
      name: "Library",
      position: {
        lat: 37.56668,
        lng: 126.97842,
      },
      sourceContentId: "heritage-1",
      themeId: "100032",
    });
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
