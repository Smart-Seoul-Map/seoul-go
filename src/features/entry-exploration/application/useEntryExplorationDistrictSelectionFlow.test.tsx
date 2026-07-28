import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { EntryExplorationDistrictSelectionResult } from "./entryExplorationDistrictJumpSelectionInteraction";
import type { EntryExplorationThreeSceneControls } from "./useEntryExplorationThreeScene";
import { useEntryExplorationDistrictSelectionFlow } from "./useEntryExplorationDistrictSelectionFlow";

const navigateMock = vi.fn();
let districtSelectionResultHandler:
  ((result: EntryExplorationDistrictSelectionResult) => void) | null = null;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("./createEntryExplorationSceneInteractionControllers", () => ({
  createEntryExplorationSceneInteractionControllers: vi.fn(({ onDistrictSelectionResult }) => {
    districtSelectionResultHandler = onDistrictSelectionResult;

    return [];
  }),
}));

describe("useEntryExplorationDistrictSelectionFlow", () => {
  test("opens the result dialog and restores exploration through scene controls", () => {
    const sceneControls = createSceneControls();
    const { result } = renderHook(() => useEntryExplorationDistrictSelectionFlow());

    act(() => {
      result.current.handleSceneControlsReady(sceneControls);
      result.current.createSceneInteractionControllers();
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.districtId).toBe(8);
    expect(result.current.dialogProps.districtName).toBe("용산구");

    act(() => {
      result.current.dialogProps.onBack();
    });

    expect(sceneControls.deactivateActiveInteraction).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
  });

  test("retries the active district selection and closes the result dialog", () => {
    const sceneControls = createSceneControls();
    const { result } = renderHook(() => useEntryExplorationDistrictSelectionFlow());

    act(() => {
      result.current.handleSceneControlsReady(sceneControls);
      result.current.createSceneInteractionControllers();
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    act(() => {
      result.current.dialogProps.onRetry();
    });

    expect(sceneControls.retryActiveInteraction).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
  });

  test("navigates to the selected district exploration route", () => {
    const { result } = renderHook(() => useEntryExplorationDistrictSelectionFlow());

    act(() => {
      result.current.createSceneInteractionControllers();
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    act(() => {
      result.current.dialogProps.onExplore();
    });

    expect(navigateMock).toHaveBeenCalledWith("/exploration/districts/8");
  });
});

function createSceneControls(): EntryExplorationThreeSceneControls {
  return {
    deactivateActiveInteraction: vi.fn(),
    retryActiveInteraction: vi.fn(),
  };
}
