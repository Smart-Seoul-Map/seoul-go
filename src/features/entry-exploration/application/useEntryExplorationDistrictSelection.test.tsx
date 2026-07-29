import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import { useEntryExplorationDistrictSelection } from "./useEntryExplorationDistrictSelection";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";

let districtSelectionResultHandler:
  ((result: EntryExplorationDistrictSelectionResult) => void) | null = null;

vi.mock("./createEntryExplorationSceneInteractionControllers", () => ({
  createEntryExplorationSceneInteractionControllers: vi.fn(({ onDistrictSelectionResult }) => {
    districtSelectionResultHandler = onDistrictSelectionResult;

    return [];
  }),
}));

describe("useEntryExplorationDistrictSelection", () => {
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
