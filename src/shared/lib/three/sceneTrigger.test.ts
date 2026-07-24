import { describe, expect, test } from "vitest";

import { isInsideSceneTriggerRadius } from "./sceneTrigger";

describe("sceneTrigger", () => {
  test("detects whether an x/z scene position is inside a trigger radius", () => {
    expect(
      isInsideSceneTriggerRadius({
        position: { x: 3, z: 4 },
        radius: 5,
        triggerPoint: { x: 0, z: 0 },
      })
    ).toBe(true);
    expect(
      isInsideSceneTriggerRadius({
        position: { x: 3.1, z: 4 },
        radius: 5,
        triggerPoint: { x: 0, z: 0 },
      })
    ).toBe(false);
  });

  test("does not activate a trigger with a negative radius", () => {
    expect(
      isInsideSceneTriggerRadius({
        position: { x: 0, z: 0 },
        radius: -1,
        triggerPoint: { x: 0, z: 0 },
      })
    ).toBe(false);
  });
});
