import { describe, expect, test } from "vitest";

import { createPlaceThemeProgressItems } from "./placeThemeProgress";

const themes = [
  { id: "night", name: "서울 야경명소", markerColor: "#1971c2" },
  { id: "art", name: "서울아트워크", markerColor: "#8b5cf6" },
] as const;

const places = [
  {
    address: "서울",
    id: "place-1",
    name: "야경 1",
    position: { lat: 37.5, lng: 126.9 },
    sourceContentId: "content-1",
    themeId: "night",
    themeName: "서울 야경명소",
  },
  {
    address: "서울",
    id: "place-2",
    name: "야경 2",
    position: { lat: 37.5, lng: 126.9 },
    sourceContentId: "content-2",
    themeId: "night",
    themeName: "서울 야경명소",
  },
  {
    address: "서울",
    id: "place-3",
    name: "아트 1",
    position: { lat: 37.5, lng: 126.9 },
    sourceContentId: "content-3",
    themeId: "art",
    themeName: "서울아트워크",
  },
] as const;

describe("createPlaceThemeProgressItems", () => {
  test("실제 장소 데이터를 전체와 테마별 진행 칩 데이터로 변환한다", () => {
    expect(createPlaceThemeProgressItems({ places, themes })).toEqual([
      {
        id: "all",
        markerColor: null,
        name: "방문지",
        totalCount: 3,
        visitedCount: 0,
      },
      {
        id: "night",
        markerColor: "#1971c2",
        name: "서울 야경명소",
        totalCount: 2,
        visitedCount: 0,
      },
      {
        id: "art",
        markerColor: "#8b5cf6",
        name: "서울아트워크",
        totalCount: 1,
        visitedCount: 0,
      },
    ]);
  });
});
