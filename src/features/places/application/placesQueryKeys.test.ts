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

  test("nearby Smart Seoul theme places key includes center and radius", () => {
    expect(
      placesQueryKeys.nearbySmartSeoulThemePlaces({
        center: { lat: 37.5657, lng: 126.9769 },
        distanceMeters: 500,
        themeIds: ["100032", "100575"],
      })
    ).toEqual([
      "places",
      "nearbySmartSeoulThemePlaces",
      ["100032", "100575"],
      126.9769,
      37.5657,
      500,
    ]);
  });
});
