import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createEntryExplorationSceneInteractionControllers } from "./createEntryExplorationSceneInteractionControllers";
import { useEntryExplorationSceneInteractionControllers } from "./useEntryExplorationSceneInteractionControllers";
import { ENTRY_INTRO_LAYOUTS } from "../config/entryIntroLayout";

vi.mock("./entryExplorationGltfLoader", () => ({
  loadEntryExplorationGltf: vi.fn(() => new Promise(() => {})),
}));

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

    expect(controllers).toHaveLength(3);
    expect(controllers[0].priority ?? 0).toBeGreaterThan(0);
    expect(controllers[1].priority ?? 0).toBeGreaterThan(0);
    expect(controllers[2].object.name).toBe("entry-slot-machine");
    expect(controllers.every((controller) => controller.object !== undefined)).toBe(true);

    controllers.forEach((controller) => {
      controller.dispose();
    });
  });

  test("the existing grid controller unlocks after the parent receives a number", () => {
    const onDartEntryBlocked = vi.fn();
    const { result, rerender, unmount } = renderHook(
      ({ numbers }: { numbers: readonly number[] }) =>
        useEntryExplorationSceneInteractionControllers({
          collectedNumbers: numbers,
          onDartEntryBlocked,
        }),
      { initialProps: { numbers: [] as readonly number[] } }
    );
    const createControllers = result.current.createSceneInteractionControllers;
    const controllers = createControllers();
    const grid = controllers[0];
    const position = ENTRY_INTRO_LAYOUTS.pc.objects["archery-range"];
    act(() => grid.updateTriggerState(position));
    expect(grid.canActivate()).toBe(false);
    expect(onDartEntryBlocked).toHaveBeenCalledTimes(1);

    grid.updateTriggerState({ x: 100, z: 100 });
    rerender({ numbers: [40, 57] });
    expect(result.current.createSceneInteractionControllers).toBe(createControllers);
    act(() => grid.updateTriggerState(position));
    expect(grid.canActivate()).toBe(true);
    grid.activate(0);
    expect(grid.isActive()).toBe(true);
    expect(onDartEntryBlocked).toHaveBeenCalledTimes(1);

    controllers.forEach((controller) => controller.dispose());
    unmount();
  });
});
