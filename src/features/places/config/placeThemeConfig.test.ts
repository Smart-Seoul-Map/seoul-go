import { describe, expect, test } from "vitest";

import {
  SMART_SEOUL_PLACE_THEME_IDS,
  SMART_SEOUL_PLACE_THEMES,
  getSmartSeoulPlaceTheme,
} from "./placeThemeConfig";

describe("Smart Seoul 장소 테마 설정", () => {
  test("승인된 5개 테마와 마커 색상을 순서대로 제공한다", () => {
    expect(SMART_SEOUL_PLACE_THEME_IDS).toEqual([
      "100032",
      "1741228380725",
      "1777251935025",
      "1725252918740",
      "100575",
    ]);
    expect(SMART_SEOUL_PLACE_THEMES.map((theme) => theme.markerColor)).toEqual([
      "#c92a2a",
      "#7b2cbf",
      "#1971c2",
      "#212529",
      "#e6a100",
    ]);
  });

  test("테마 ID로 표시 이름과 색상을 찾는다", () => {
    expect(getSmartSeoulPlaceTheme("100575")).toEqual({
      id: "100575",
      name: "오래가게",
      markerColor: "#e6a100",
      markerImage: "yellow_closed_box",
    });
  });
});
