import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { EntryExplorationDistrictSelectionResult } from "../application/entryExplorationDistrictJumpSelectionInteraction";
import type {
  EntryExplorationThreeSceneControls,
  UseEntryExplorationThreeSceneOptions,
} from "../application/useEntryExplorationThreeScene";
import { EntryExplorationPage } from "./EntryExplorationPage";

const sceneControls = {
  deactivateActiveInteraction: vi.fn(),
  retryActiveInteraction: vi.fn(),
} satisfies EntryExplorationThreeSceneControls;

let districtSelectionResultHandler:
  ((result: EntryExplorationDistrictSelectionResult) => void) | null = null;

vi.mock("../application/createEntryExplorationSceneInteractionControllers", () => ({
  createEntryExplorationSceneInteractionControllers: vi.fn(({ onDistrictSelectionResult }) => {
    districtSelectionResultHandler = onDistrictSelectionResult;

    return [];
  }),
}));

vi.mock("../application/useEntryExplorationThreeScene", () => ({
  useEntryExplorationThreeScene: ({
    createSceneInteractionControllers,
    onSceneControlsReady,
  }: UseEntryExplorationThreeSceneOptions) => {
    createSceneInteractionControllers();
    onSceneControlsReady?.(sceneControls);
  },
}));

describe("EntryExplorationPage", () => {
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

  test("shows selected district result and restores normal exploration when back action is clicked", () => {
    renderEntryExplorationPage();

    act(() => {
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    expect(screen.getByRole("dialog", { name: "용산구 선택" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "일반 탐방으로 돌아가기" }));

    expect(sceneControls.deactivateActiveInteraction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "용산구 선택" })).toBeNull();
  });

  test("retries district selection from the result dialog", () => {
    renderEntryExplorationPage();

    act(() => {
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "다시 선택하기" }));

    expect(sceneControls.retryActiveInteraction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "용산구 선택" })).toBeNull();
  });

  test("navigates to selected district exploration path from the result dialog", async () => {
    renderEntryExplorationPage();

    act(() => {
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "탐방하기" }));

    expect(await screen.findByText("district exploration route")).toBeTruthy();
  });
});

function renderEntryExplorationPage() {
  districtSelectionResultHandler = null;
  sceneControls.deactivateActiveInteraction.mockClear();
  sceneControls.retryActiveInteraction.mockClear();

  const router = createMemoryRouter([
    {
      element: <EntryExplorationPage />,
      path: "/",
    },
    {
      element: <div>district exploration route</div>,
      path: "/exploration/districts/:districtId",
    },
  ]);

  return render(<RouterProvider router={router} />);
}
