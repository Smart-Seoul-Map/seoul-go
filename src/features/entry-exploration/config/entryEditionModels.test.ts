import { expect, test } from "vitest";

import { ENTRY_EDITION_MODELS, ENTRY_EDITION_PLACE_COUNT } from "./entryEditionModels";

test("gives every modeled place its own edition slot within the layout", () => {
  const editionIndexes = Object.values(ENTRY_EDITION_MODELS).map((model) => model.editionIndex);

  expect(new Set(editionIndexes).size).toBe(editionIndexes.length);
  for (const editionIndex of editionIndexes) {
    expect(Number.isInteger(editionIndex)).toBe(true);
    expect(editionIndex).toBeGreaterThanOrEqual(0);
    expect(editionIndex).toBeLessThan(ENTRY_EDITION_PLACE_COUNT);
  }
});

test("keeps Namsan Park Baekbeom Square in the first edition slot", () => {
  expect(ENTRY_EDITION_MODELS["smart-seoul:1786321258890:25_edition25_24"].editionIndex).toBe(0);
});
