import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LINE2_SELECTION_ANIMATION_DURATION_MS } from "../config/line2SelectionConfig";
import { SubwaySelectionControls } from "./SubwaySelectionControls";

describe("SubwaySelectionControls", () => {
  const frameCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    frameCallbacks.length = 0;
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);

        return frameCallbacks.length;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("closes from the outside or close button while the train is stopped", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={handleClose}
        onTrainPositionChange={vi.fn()}
      />
    );
    const layer = container.querySelector(".subway-selection-layer");

    expect(layer).not.toBeNull();
    fireEvent.pointerDown(layer!);
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));

    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  test("blocks repeated input until the camera transition is complete", () => {
    const handleClose = vi.fn();
    const handleTrainPositionChange = vi.fn();
    const { container, rerender } = render(
      <SubwaySelectionControls
        isInteractionLocked
        onClose={handleClose}
        onTrainPositionChange={handleTrainPositionChange}
      />
    );
    const layer = container.querySelector(".subway-selection-layer");

    fireEvent.pointerDown(layer!);
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));

    expect(screen.getByRole("button", { name: "랜덤 역 선정하기" }).hasAttribute("disabled")).toBe(
      true
    );
    expect(handleClose).not.toHaveBeenCalled();

    rerender(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={handleClose}
        onTrainPositionChange={handleTrainPositionChange}
      />
    );
    fireEvent.pointerDown(layer!);

    expect(handleClose).toHaveBeenCalledOnce();
  });

  test("blocks closing while selecting and shows an inert exploration button afterward", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={handleClose}
        onTrainPositionChange={vi.fn()}
      />
    );
    const layer = container.querySelector(".subway-selection-layer");

    fireEvent.click(screen.getByRole("button", { name: "랜덤 역 선정하기" }));
    fireEvent.pointerDown(layer!);
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(LINE2_SELECTION_ANIMATION_DURATION_MS);
    });

    fireEvent.click(screen.getByRole("button", { name: "시청역 탐험하기" }));
    expect(handleClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(layer!);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
