import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";

describe("EntryExplorationDistrictSelectionDialog", () => {
  test("opens when a district selection result is provided and closes through back action", () => {
    const handleBack = vi.fn();

    render(
      <EntryExplorationDistrictSelectionDialog
        onBack={handleBack}
        onExplore={vi.fn()}
        onRetry={vi.fn()}
        selectionResult={{
          districtId: 8,
          districtName: "용산구",
        }}
      />
    );

    expect(screen.getByRole("dialog", { name: "용산구 선택" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "일반 탐방으로 돌아가기" }));

    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "용산구 선택" })).toBeNull();
  });

  test("retries district selection and closes the dialog", () => {
    const handleRetry = vi.fn();

    render(
      <EntryExplorationDistrictSelectionDialog
        onBack={vi.fn()}
        onExplore={vi.fn()}
        onRetry={handleRetry}
        selectionResult={{
          districtId: 8,
          districtName: "용산구",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 선택하기" }));

    expect(handleRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "용산구 선택" })).toBeNull();
  });

  test("requests exploration with the selected district id", () => {
    const handleExplore = vi.fn();

    render(
      <EntryExplorationDistrictSelectionDialog
        onBack={vi.fn()}
        onExplore={handleExplore}
        onRetry={vi.fn()}
        selectionResult={{
          districtId: 8,
          districtName: "용산구",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "탐방하기" }));

    expect(handleExplore).toHaveBeenCalledWith(8);
  });
});
