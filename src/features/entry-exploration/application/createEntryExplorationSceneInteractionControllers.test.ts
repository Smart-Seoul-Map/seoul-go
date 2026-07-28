import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import { createEntryExplorationDistrictJumpSelectionInteractionController } from "./entryExplorationDistrictJumpSelectionInteraction";

describe("createEntryExplorationSceneInteractionControllers", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      arc: vi.fn(),
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      lineWidth: 0,
      strokeRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates the registered entry exploration interaction controllers", () => {
    const controllers = createEntryExplorationSceneInteractionControllers();

    expect(controllers).toHaveLength(1);
    expect(controllers.every((controller) => (controller.priority ?? 0) > 0)).toBe(true);
    expect(controllers.every((controller) => controller.object !== undefined)).toBe(true);

    controllers.forEach((controller) => {
      controller.dispose();
    });
  });

  test("appends extra interaction controllers", () => {
    const extraController = createEntryExplorationDistrictJumpSelectionInteractionController();
    const controllers = createEntryExplorationSceneInteractionControllers({
      extraControllers: [extraController],
    });

    expect(controllers).toHaveLength(2);
    expect(controllers[1]).toBe(extraController);

    controllers.forEach((controller) => {
      controller.dispose();
    });
  });
});
