import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntryExplorationDartGuide } from "./EntryExplorationDartGuide";

afterEach(() => {
  cleanup();
});

describe("EntryExplorationDartGuide", () => {
  test("shows only the close button before a result lands", () => {
    renderDartGuide();

    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByText(/화살을 클릭해/)).toBeNull();
    expect(screen.getByRole("button", { name: "격자번호 다트 닫기" })).toBeTruthy();
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
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "격자번호 다트 닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
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
    />
  );
}
