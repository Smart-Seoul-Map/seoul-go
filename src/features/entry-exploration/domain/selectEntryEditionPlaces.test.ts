import { expect, test } from "vitest";

import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { selectEntryEditionPlaces } from "./selectEntryEditionPlaces";

const places = Array.from({ length: 50 }, (_, index) => ({
  ...ENTRY_TEST_PLACES[0],
  id: `smart-seoul:1786321258890:${index < 25 ? 25 : 26}_edition25_${(index % 25) + 1}`,
}));

test("selects ten unique places without touching source data or repeating the previous ten", () => {
  const previous = places.slice(0, 10).map((place) => place.id);
  const selected = selectEntryEditionPlaces(places, previous, () => 0.5);
  expect(selected).toHaveLength(10);
  expect(new Set(selected.map((place) => place.id)).size).toBe(10);
  expect(selected.every((place) => !previous.includes(place.id))).toBe(true);
  expect(places[0].id).toBe("smart-seoul:1786321258890:25_edition25_1");
});

test("fills shortages from the previous selection without duplicate places", () => {
  const source = places.slice(0, 12);
  const previous = source.slice(0, 10).map((place) => place.id);
  const selected = selectEntryEditionPlaces([...source, source[0]], previous, () => 0.5);
  expect(selected).toHaveLength(10);
  expect(new Set(selected.map((place) => place.id)).size).toBe(10);
  expect(selected.filter((place) => previous.includes(place.id))).toHaveLength(8);
  expect(selected).toContain(source[10]);
  expect(selected).toContain(source[11]);
});

test("uses all available places when fewer than ten exist and handles an empty response", () => {
  expect(selectEntryEditionPlaces(places.slice(0, 4), [], () => 0.5)).toHaveLength(4);
  expect(selectEntryEditionPlaces([], [])).toEqual([]);
});
