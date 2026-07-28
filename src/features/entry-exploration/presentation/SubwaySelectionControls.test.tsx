import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { SubwaySelectionControls } from "./SubwaySelectionControls";

describe("SubwaySelectionControls", () => {
  afterEach(cleanup);

  test("closes from the outside or close button while the train is stopped", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={handleClose}
        onStationSelection={vi.fn()}
        selectedStation={null}
        status="idle"
      />
    );
    const layer = container.querySelector(".subway-selection-layer");

    expect(layer).not.toBeNull();
    fireEvent.pointerDown(layer!);
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));

    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  test("blocks input until the camera transition is complete", () => {
    const handleClose = vi.fn();
    const handleStationSelection = vi.fn();
    const { container } = render(
      <SubwaySelectionControls
        isInteractionLocked
        onClose={handleClose}
        onStationSelection={handleStationSelection}
        selectedStation={null}
        status="idle"
      />
    );
    const layer = container.querySelector(".subway-selection-layer");

    fireEvent.pointerDown(layer!);
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));
    fireEvent.click(screen.getByRole("button", { name: "랜덤 역 선정하기" }));

    expect(handleClose).not.toHaveBeenCalled();
    expect(handleStationSelection).not.toHaveBeenCalled();
  });

  test("delegates selection and blocks closing while the train is moving", () => {
    const handleClose = vi.fn();
    const handleStationSelection = vi.fn();
    const { container, rerender } = render(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={handleClose}
        onStationSelection={handleStationSelection}
        selectedStation={null}
        status="idle"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "랜덤 역 선정하기" }));

    expect(handleStationSelection).toHaveBeenCalledOnce();

    rerender(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={handleClose}
        onStationSelection={handleStationSelection}
        selectedStation={null}
        status="selecting"
      />
    );
    fireEvent.pointerDown(container.querySelector(".subway-selection-layer")!);
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));

    expect(handleClose).not.toHaveBeenCalled();
  });

  test("shows the selected station result", () => {
    render(
      <SubwaySelectionControls
        isInteractionLocked={false}
        onClose={vi.fn()}
        onStationSelection={vi.fn()}
        selectedStation={{
          id: "201",
          name: "시청",
          position: { x: 46.73, y: 15.28 },
        }}
        status="selected"
      />
    );

    expect(screen.getByText("시청역이 선정되었습니다.")).toBeDefined();
    expect(screen.getByRole("button", { name: "시청역 탐험하기" })).toBeDefined();
  });
});
