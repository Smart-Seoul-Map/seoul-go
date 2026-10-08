import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntryExplorationDartGuide } from "./EntryExplorationDartGuide";

const useIsMobileViewport = vi.fn(() => false);

vi.mock("@shared/lib/responsive/useIsMobileViewport", () => ({
  useIsMobileViewport: () => useIsMobileViewport(),
}));

afterEach(() => {
  cleanup();
  useIsMobileViewport.mockReturnValue(false);
});

describe("EntryExplorationDartGuide", () => {
  test("shows the intro card on desktop", () => {
    renderDartGuide();

    expect(screen.getByRole("heading", { name: "서울 지도에 화살을 쏴 볼까요?" })).toBeTruthy();
    expect(screen.getByText(/명중하면 오늘 탐방을 시작할/)).toBeTruthy();
  });

  test("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <EntryExplorationDartGuide
        isVisible
        landedResult={null}
        onClose={onClose}
        onRetryThrow={vi.fn()}
        onStartExploration={vi.fn()}
        shotResult={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "격자번호 다트 닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("hides the intro card on mobile and promotes the bottom hint text", () => {
    useIsMobileViewport.mockReturnValue(true);

    renderDartGuide();

    expect(screen.queryByText(/명중하면 오늘 탐방을 시작할/)).toBeNull();
    expect(screen.getByRole("heading", { name: "서울 지도에 화살을 쏴 볼까요?" })).toBeTruthy();
  });
});

function renderDartGuide() {
  return render(
    <EntryExplorationDartGuide
      isVisible
      landedResult={null}
      onClose={vi.fn()}
      onRetryThrow={vi.fn()}
      onStartExploration={vi.fn()}
      shotResult={null}
    />
  );
}
