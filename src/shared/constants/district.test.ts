import { describe, expect, test } from "vitest";

import { getSeoulDistrictById, getSeoulDistrictByName, SEOUL_DISTRICTS } from "./district";

describe("Seoul district constants", () => {
  test("contains all 25 Seoul districts", () => {
    expect(SEOUL_DISTRICTS).toHaveLength(25);
  });

  test("finds a district office position by district id", () => {
    expect(getSeoulDistrictById(8)).toMatchObject({
      name: "용산구",
      officePosition: {
        lng: 126.990703,
        lat: 37.532326,
      },
    });
  });

  test("finds a district by name", () => {
    expect(getSeoulDistrictByName("강남구")).toMatchObject({
      id: 1,
      officePosition: {
        lng: 127.047375,
        lat: 37.517507,
      },
    });
  });

  test("returns null for unknown district values", () => {
    expect(getSeoulDistrictById(0)).toBeNull();
    expect(getSeoulDistrictByName("없는구")).toBeNull();
  });
});
