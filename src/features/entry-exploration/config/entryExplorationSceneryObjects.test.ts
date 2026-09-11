import { expect, test } from "vitest";

import manifest from "../../../assets/entry-exploration/intro-atlas.json";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "./entryExplorationSceneryObjects";

test("places every scenery frame once with valid bounds", () => {
  const keys = ENTRY_EXPLORATION_SCENERY_OBJECTS.map(({ key }) => key);
  expect(new Set(keys).size).toBe(keys.length);
  expect([...keys].sort()).toEqual(Object.keys(manifest.frames).sort());
  for (const frame of Object.values(manifest.frames)) {
    expect(frame.x + frame.width).toBeLessThanOrEqual(manifest.size.width);
    expect(frame.y + frame.height).toBeLessThanOrEqual(manifest.size.height);
  }
});
