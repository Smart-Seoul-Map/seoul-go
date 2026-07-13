import { describe, expect, test } from "vitest";

import { placesQueryKeys } from "./placesQueryKeys";

describe("places query keys", () => {
  test("Smart Seoul 테마 장소 캐시 키를 중앙 객체에서 만든다", () => {
    expect(placesQueryKeys.all).toEqual(["places"]);
    expect(placesQueryKeys.smartSeoulThemePlaces(["100032", "100575"])).toEqual([
      "places",
      "smartSeoulThemePlaces",
      ["100032", "100575"],
    ]);
  });
});
