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
});
