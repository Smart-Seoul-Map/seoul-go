import { describe, expect, test } from "vitest";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";

describe("createEntryExplorationSceneInteractionControllers", () => {
  test("creates the registered entry exploration interaction controllers", () => {
    const controllers = createEntryExplorationSceneInteractionControllers();

    expect(controllers).toHaveLength(1);
    expect(controllers[0]?.priority).toBeGreaterThan(0);
    expect(controllers[0]?.object).toBeDefined();
  });
});
