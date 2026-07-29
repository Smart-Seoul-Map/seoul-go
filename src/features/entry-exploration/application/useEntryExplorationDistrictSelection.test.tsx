import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import { useEntryExplorationDistrictSelection } from "./useEntryExplorationDistrictSelection";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

let districtSelectionResultHandler:
  ((result: EntryExplorationDistrictSelectionResult) => void) | null = null;
let registeredExtraControllers: readonly EntryExplorationSceneInteractionController[] = [];

vi.mock("./createEntryExplorationSceneInteractionControllers", () => ({
  createEntryExplorationSceneInteractionControllers: vi.fn(
    ({ extraControllers = [], onDistrictSelectionResult }) => {
      districtSelectionResultHandler = onDistrictSelectionResult;
      registeredExtraControllers = extraControllers;

      return [];
    }
  ),
}));

describe("useEntryExplorationDistrictSelection", () => {
  test("composes extra scene interactions through the common controller factory", () => {
    const extraController = {} as EntryExplorationSceneInteractionController;
    const createExtraSceneInteractionControllers = vi.fn(() => [extraController]);
    const { result } = renderHook(() =>
      useEntryExplorationDistrictSelection({
        createExtraSceneInteractionControllers,
      })
    );

    act(() => {
      result.current.createSceneInteractionControllers();
    });

    expect(createExtraSceneInteractionControllers).toHaveBeenCalledTimes(1);
    expect(registeredExtraControllers).toEqual([extraController]);
  });

  test("stores the district selected by the scene interaction", () => {
    const { result } = renderHook(() => useEntryExplorationDistrictSelection());

    act(() => {
      result.current.createSceneInteractionControllers();
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    expect(result.current.selectionResult).toEqual({
      districtId: 8,
      districtName: "용산구",
    });
  });

  test("deactivates the active scene interaction and clears selected district", () => {
    const sceneControls = createSceneControls();
    const { result } = renderHook(() => useEntryExplorationDistrictSelection());

    act(() => {
      result.current.handleSceneControlsReady(sceneControls);
      result.current.createSceneInteractionControllers();
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    act(() => {
      result.current.deactivateSelection();
    });

    expect(sceneControls.deactivateActiveInteraction).toHaveBeenCalledTimes(1);
    expect(result.current.selectionResult).toBeNull();
  });

  test("retries the active scene interaction and clears selected district", () => {
    const sceneControls = createSceneControls();
    const { result } = renderHook(() => useEntryExplorationDistrictSelection());

    act(() => {
      result.current.handleSceneControlsReady(sceneControls);
      result.current.createSceneInteractionControllers();
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    act(() => {
      result.current.retrySelection();
    });

    expect(sceneControls.retryActiveInteraction).toHaveBeenCalledTimes(1);
    expect(result.current.selectionResult).toBeNull();
  });
});

function createSceneControls(): EntryExplorationThreeSceneControls {
  return {
    deactivateActiveInteraction: vi.fn(),
    retryActiveInteraction: vi.fn(),
  };
}
