import { describe, expect, test } from "vitest";

import { createPlaceThemeProgressItems } from "./placeThemeProgress";

const themes = [
  { id: "night", name: "Night", markerColor: "#1971c2" },
  { id: "art", name: "Art", markerColor: "#8b5cf6" },
] as const;

const places = [
  createPlace({ id: "place-1", themeId: "night", themeName: "Night" }),
  createPlace({ id: "place-2", themeId: "night", themeName: "Night" }),
  createPlace({ id: "place-3", themeId: "art", themeName: "Art" }),
] as const;

describe("createPlaceThemeProgressItems", () => {
  test("creates total and theme progress items from places", () => {
    const items = createPlaceThemeProgressItems({ places, themes });

    expect(items).toEqual([
      expect.objectContaining({
        id: "all",
        markerColor: null,
        totalCount: 3,
        visitedCount: 0,
      }),
      {
        id: "night",
        markerColor: "#1971c2",
        name: "Night",
        totalCount: 2,
        visitedCount: 0,
      },
      {
        id: "art",
        markerColor: "#8b5cf6",
        name: "Art",
        totalCount: 1,
        visitedCount: 0,
      },
    ]);
  });
});

function createPlace({
  id,
  themeId,
  themeName,
}: {
  id: string;
  themeId: string;
  themeName: string;
}) {
  return {
    address: "Seoul",
    districtName: "district-a",
    id,
    name: id,
    position: { lat: 37.5, lng: 126.9 },
    sourceContentId: id,
    themeId,
    themeName,
  };
}
