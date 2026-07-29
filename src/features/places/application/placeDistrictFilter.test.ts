import { describe, expect, test } from "vitest";

import type { SmartSeoulThemePlace } from "../domain/place";
import { filterSmartSeoulPlacesByDistrict } from "./placeDistrictFilter";

const places = [
  createPlace({ districtName: "district-a", id: "place-1" }),
  createPlace({ districtName: "district-b", id: "place-2" }),
] as const;

describe("filterSmartSeoulPlacesByDistrict", () => {
  test("returns every place when district name is empty", () => {
    expect(filterSmartSeoulPlacesByDistrict(places).map((place) => place.id)).toEqual([
      "place-1",
      "place-2",
    ]);
  });

  test("returns only places that match the district name", () => {
    expect(filterSmartSeoulPlacesByDistrict(places, "district-a").map((place) => place.id)).toEqual(
      ["place-1"]
    );
  });
});

function createPlace({
  districtName,
  id,
}: {
  districtName: string;
  id: string;
}): SmartSeoulThemePlace {
  return {
    address: "Seoul",
    districtName,
    id,
    name: id,
    position: { lat: 37.5, lng: 126.9 },
    sourceContentId: id,
    themeId: "100032",
    themeName: "Theme",
  };
}
