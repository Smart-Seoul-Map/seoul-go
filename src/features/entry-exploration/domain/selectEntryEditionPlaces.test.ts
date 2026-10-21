import { expect, test } from "vitest";

import type { EntryEditionModel } from "../config/entryEditionModels";
import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { selectEntryEditionPlaces } from "./selectEntryEditionPlaces";

const MODELS: Record<string, EntryEditionModel> = {
  first: { url: "/first.glb", size: 1, rotationY: 0 },
  second: { url: "/second.glb", size: 1, rotationY: 0 },
  fourth: { url: "/fourth.glb", size: 1, rotationY: 0 },
};

function place(id: string) {
  return { ...ENTRY_TEST_PLACES[0], id };
}

test("orders modeled places by their registered order regardless of the response order", () => {
  const source = [place("fourth"), place("unmodeled"), place("first"), place("second")];

  expect(selectEntryEditionPlaces(source, MODELS).map(({ id }) => id)).toEqual([
    "first",
    "second",
    "fourth",
  ]);
  expect(source.map(({ id }) => id)).toEqual(["fourth", "unmodeled", "first", "second"]);
});

test("returns the same selection on every call and drops duplicate records", () => {
  const source = [place("second"), place("first"), place("second")];

  const first = selectEntryEditionPlaces(source, MODELS).map(({ id }) => id);
  const second = selectEntryEditionPlaces([...source].reverse(), MODELS).map(({ id }) => id);

  expect(first).toEqual(["first", "second"]);
  expect(second).toEqual(first);
});

test("leaves a missing place out and keeps the others in registered order", () => {
  const selected = selectEntryEditionPlaces([place("fourth"), place("second")], MODELS);

  expect(selected.map(({ id }) => id)).toEqual(["second", "fourth"]);
  expect(selectEntryEditionPlaces([], MODELS)).toEqual([]);
});
