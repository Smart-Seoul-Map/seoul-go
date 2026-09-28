import { describe, expect, test } from "vitest";

import {
  normalizeSmartSeoulThemeContent,
  normalizeSmartSeoulThemeContentsResponse,
} from "./placeNormalizer";

describe("normalizeSmartSeoulThemeContent", () => {
  test.each(["100032", "100575", "1786321258890"])(
    "normalizes the description for theme %s",
    (themeId) => {
      const place = normalizeSmartSeoulThemeContent({
        COT_CONTS_ID: "26_edition25_24",
        COT_CONTS_NAME: "Place",
        COT_COORD_X: 126.991821159,
        COT_COORD_Y: 37.566987659,
        COT_THEME_ID: themeId,
        COT_VALUE_01: " <p>Historic alley</p>&nbsp;with shops &amp; cafes. ",
      });

      expect(place).toMatchObject({ description: "Historic alley with shops & cafes." });
    }
  );

  test.each([undefined, null, "", "null", "  "])(
    "normalizes an empty description (%s) without inserting UI copy",
    (description) => {
      const place = normalizeSmartSeoulThemeContent({
        COT_CONTS_ID: "old-store-1",
        COT_CONTS_NAME: "Old store",
        COT_COORD_X: 126.9,
        COT_COORD_Y: 37.5,
        COT_THEME_ID: "100575",
        COT_VALUE_01: description,
      });

      expect(place).toMatchObject({ description: "" });
    }
  );

  test.each([
    ["25_edition25_1", 2025],
    ["26_edition25_24", 2026],
    ["27_edition25_9", 2027],
  ])("reads the selection year from %s", (sourceContentId, selectionYear) => {
    const place = normalizeSmartSeoulThemeContent({
      COT_CONTS_ID: sourceContentId,
      COT_CONTS_NAME: "Edition place",
      COT_COORD_X: 126.991821159,
      COT_COORD_Y: 37.566987659,
      COT_THEME_ID: "1786321258890",
      THM_THEME_NAME: "서울에디션25(등록중)",
      COT_IMG_MAIN_URL: "https://example.com/edition-place.png",
    });

    expect(place).toMatchObject({
      id: `smart-seoul:1786321258890:${sourceContentId}`,
      sourceContentId,
      themeName: "서울에디션25",
      selectionYear,
      imageUrl: "https://example.com/edition-place.png",
      address: "",
    });
  });

  test("does not assign an edition year to another theme", () => {
    const place = normalizeSmartSeoulThemeContent({
      COT_CONTS_ID: "26_edition25_24",
      COT_CONTS_NAME: "Old store",
      COT_COORD_X: 126.9,
      COT_COORD_Y: 37.5,
      COT_THEME_ID: "100575",
    });

    expect(place).not.toBeNull();
    expect(place).not.toHaveProperty("selectionYear", 2026);
  });

  test.each(["edition25_24", "2026_edition25_24", "26_other_24", "26_edition25_24_extra"])(
    "does not invent a selection year for malformed ID %s",
    (sourceContentId) => {
      const place = normalizeSmartSeoulThemeContent({
        COT_CONTS_ID: sourceContentId,
        COT_CONTS_NAME: "Edition place",
        COT_COORD_X: 126.9,
        COT_COORD_Y: 37.5,
        COT_THEME_ID: "1786321258890",
        COT_REG_DATE: "2026-08-14 15:50:51",
      });

      expect(place).not.toBeNull();
      expect(place).toMatchObject({ selectionYear: undefined });
    }
  );

  test("normalizes a valid Smart Seoul theme content row", () => {
    const place = normalizeSmartSeoulThemeContent({
      COT_ADDR_FULL_NEW: "Seoul Jung-gu",
      COT_CONTS_ID: "heritage-1",
      COT_CONTS_NAME: "<b>Library</b>&nbsp;",
      COT_COORD_X: "126.97842",
      COT_COORD_Y: "37.56668",
      COT_GU_NAME: "district-a",
      COT_IMG_MAIN_URL: "https://example.com/library.jpg",
      COT_THEME_ID: "100032",
    });

    expect(place).toMatchObject({
      address: "Seoul Jung-gu",
      districtName: "district-a",
      id: "smart-seoul:100032:heritage-1",
      imageUrl: "https://example.com/library.jpg",
      name: "Library",
      position: {
        lat: 37.56668,
        lng: 126.97842,
      },
      sourceContentId: "heritage-1",
      themeId: "100032",
    });
  });

  test("normalizes Smart Seoul relative image paths to absolute URLs", () => {
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
      "https://map.seoul.go.kr/smgis2/file/ucimgs/conts/100575/%EC%95%84%EB%8B%A4%EB%AA%A8%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4%20(1).jpg"
    );
    expect(pathRelativePlace?.imageUrl).toBe(
      "https://map.seoul.go.kr/smgis/ucimgs/conts/1777251935025/place.jpg"
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
