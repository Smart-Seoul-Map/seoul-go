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
    expect(
      SMART_SEOUL_PLACE_THEMES.map(
        ({ markerColor, markerColorToken, closedBoxImage, openBoxImage }) => ({
          markerColor,
          markerColorToken,
          closedBoxImage,
          openBoxImage,
        })
      )
    ).toEqual([
      {
        markerColor: "#c92a2a",
        markerColorToken: "--sg-place-theme-red",
        closedBoxImage: "red_closed_box",
        openBoxImage: "red_open_box",
      },
      {
        markerColor: "#7b2cbf",
        markerColorToken: "--sg-place-theme-purple",
        closedBoxImage: "purple_closed_box",
        openBoxImage: "purple_open_box",
      },
      {
        markerColor: "#1971c2",
        markerColorToken: "--sg-place-theme-blue",
        closedBoxImage: "blue_closed_box",
        openBoxImage: "blue_open_box",
      },
      {
        markerColor: "#212529",
        markerColorToken: "--sg-place-theme-black",
        closedBoxImage: "black_closed_box",
        openBoxImage: "black_open_box",
      },
      {
        markerColor: "#e6a100",
        markerColorToken: "--sg-place-theme-yellow",
        closedBoxImage: "yellow_closed_box",
        openBoxImage: "yellow_open_box",
      },
    ]);
  });

  test("테마 ID로 표시 이름과 색상을 찾는다", () => {
    expect(getSmartSeoulPlaceTheme("100575")).toEqual({
      id: "100575",
      name: "오래가게",
      markerColor: "#e6a100",
      markerColorToken: "--sg-place-theme-yellow",
      closedBoxImage: "yellow_closed_box",
      openBoxImage: "yellow_open_box",
    });
  });
});
