import { describe, expect, test } from "vitest";

import { normalizeSmartSeoulThemeContentsResponse } from "../domain/placeNormalizer";
import { filterSmartSeoulPlacesByDistrict } from "./placeDistrictFilter";
import { createSeoulEdition25MapContent } from "./seoulEdition25MapContent";

describe("createSeoulEdition25MapContent", () => {
  test("shows only edition places in the current district and lists their selection years", () => {
    const places = normalizeSmartSeoulThemeContentsResponse({
      body: [
        { COT_THEME_ID: "1786321258890", COT_CONTS_ID: "26_edition25_24", COT_GU_NAME: "용산구" },
        { COT_THEME_ID: "1786321258890", COT_CONTS_ID: "25_edition25_24", COT_GU_NAME: "용산구" },
        { COT_THEME_ID: "1786321258890", COT_CONTS_ID: "26_edition25_23", COT_GU_NAME: "종로구" },
        { COT_THEME_ID: "100575", COT_CONTS_ID: "old-store", COT_GU_NAME: "용산구" },
      ].map((row) => ({
        ...row,
        COT_CONTS_NAME: "Place",
        COT_COORD_X: 126.98,
        COT_COORD_Y: 37.54,
      })),
    });

    const content = createSeoulEdition25MapContent(
      filterSmartSeoulPlacesByDistrict(places, "용산구")
    );

    expect(content.placeMarkers.features.map((feature) => feature.id)).toEqual([
      "smart-seoul:1786321258890:26_edition25_24",
      "smart-seoul:1786321258890:25_edition25_24",
    ]);
    expect(content.selectionYearLabel).toBe("서울에디션25 · 25 · 26");
    expect(content.themeProgressItems).toMatchObject([
      { id: "1786321258890", name: "서울에디션25", totalCount: 2, visitedCount: 0 },
    ]);
    expect(places).toHaveLength(4);
  });

  test("keeps a zero-count edition badge when the area has no edition places", () => {
    const content = createSeoulEdition25MapContent([]);

    expect(content.selectionYearLabel).toBe("서울에디션25");
    expect(content.placeMarkers.features).toEqual([]);
    expect(content.themeProgressItems).toMatchObject([{ totalCount: 0 }]);
  });
});
