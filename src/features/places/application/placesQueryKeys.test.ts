import { describe, expect, test } from "vitest";

import { placesQueryKeys } from "./placesQueryKeys";

describe("placesQueryKeys", () => {
  test("Smart Seoul theme places key is based on source query params only", () => {
    expect(placesQueryKeys.all).toEqual(["places"]);
    expect(placesQueryKeys.smartSeoulThemePlaces(["100032", "100575"])).toEqual([
      "places",
      "smartSeoulThemePlaces",
      ["100032", "100575"],
    ]);
  });

  test("linked places key is per theme and keeps the linkedPlaces prefix", () => {
    expect(
      placesQueryKeys.linkedPlaces({
        center: { lat: 37.5657, lng: 126.9769 },
        distanceMeters: 1000,
        themeId: "100032",
      })
    ).toEqual(["places", "linkedPlaces", "100032", 126.9769, 37.5657, 1000]);
  });
});
