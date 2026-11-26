import { describe, expect, test } from "vitest";

import { normalizeSmartSeoulThemeContentsResponse } from "../domain/placeNormalizer";
import { filterSmartSeoulPlacesByDistrict } from "./placeDistrictFilter";
import { createSeoulEdition25MapContent } from "./seoulEdition25MapContent";

describe("createSeoulEdition25MapContent", () => {
  test("shows only edition places in the current district and preserves marker selection years", () => {
    const places = normalizeSmartSeoulThemeContentsResponse({
      body: [
        { COT_THEME_ID: "1786321258890", COT_CONTS_ID: "2026_Yongsan-gu", COT_GU_NAME: "용산구" },
        { COT_THEME_ID: "1786321258890", COT_CONTS_ID: "2025_Yongsan-gu", COT_GU_NAME: "용산구" },
        { COT_THEME_ID: "1786321258890", COT_CONTS_ID: "2026_Jongno-gu", COT_GU_NAME: "종로구" },
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
      "smart-seoul:1786321258890:2026_Yongsan-gu",
      "smart-seoul:1786321258890:2025_Yongsan-gu",
    ]);
    expect(content).not.toHaveProperty("selectionYearLabel");
    expect(
      content.placeMarkers.features.map((feature) => feature.properties.selectionYear)
    ).toEqual([2026, 2025]);
    expect(content.themeProgressItems).toMatchObject([
      { id: "1786321258890", name: "서울에디션25", totalCount: 2, visitedCount: 0 },
    ]);
    expect(places).toHaveLength(4);
  });

  test("keeps a zero-count edition badge when the area has no edition places", () => {
    const content = createSeoulEdition25MapContent([]);

    expect(content.placeMarkers.features).toEqual([]);
    expect(content.themeProgressItems).toMatchObject([{ totalCount: 0 }]);
  });
});
