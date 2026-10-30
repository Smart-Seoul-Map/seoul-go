import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ENTRY_GUIDE_MESSAGES } from "../config/entryGuideMessages";
import { ENTRY_NATIONAL_POINT_LINK } from "../config/entryNationalPointLink";
import { EntryCollectedNumbersGuideDialog } from "./EntryCollectedNumbersGuideDialog";

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@shared/lib/analytics/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/lib/analytics/analytics")>()),
  track: trackMock,
}));

const STEPS = ENTRY_GUIDE_MESSAGES.numberGuide.steps;

afterEach(() => {
  cleanup();
  trackMock.mockClear();
});

function goToStep(count: number): void {
  for (let index = 0; index < count; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
  }
}

describe("EntryCollectedNumbersGuideDialog", () => {
  test("walks through visiting, earning numbers and throwing the dart", () => {
    const onOpenChange = vi.fn();
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("heading", { name: STEPS[0].title })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "이전" })).toBeNull();

    goToStep(1);
    expect(screen.getByRole("heading", { name: STEPS[1].title })).toBeTruthy();
    expect(screen.getByText(ENTRY_GUIDE_MESSAGES.numberGuide.clueLead)).toBeTruthy();
    expect(screen.queryByText(/슬롯/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("heading", { name: STEPS[0].title })).toBeTruthy();

    goToStep(2);
    expect(screen.getByRole("heading", { name: STEPS[2].title })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trackMock).toHaveBeenCalledWith({ name: "entry_guide_close", step: 3, completed: true });
  });

  test("starts again from the first step when reopened", () => {
    const { rerender } = render(<EntryCollectedNumbersGuideDialog open onOpenChange={vi.fn()} />);
    goToStep(2);

    rerender(<EntryCollectedNumbersGuideDialog open={false} onOpenChange={vi.fn()} />);
    rerender(<EntryCollectedNumbersGuideDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("heading", { name: STEPS[0].title })).toBeTruthy();
  });

  test("closes with the close button and records the step it was closed on", () => {
    const onOpenChange = vi.fn();
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={onOpenChange} />);
    goToStep(1);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trackMock).toHaveBeenCalledWith({
      name: "entry_guide_close",
      step: 2,
      completed: false,
    });
  });

  test("closes when the backdrop is clicked", () => {
    const onOpenChange = vi.fn();
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("opens the national point number page in a new tab without sharing the opener", () => {
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={vi.fn()} />);
    goToStep(1);

    const link = screen.getByRole("link", { name: ENTRY_NATIONAL_POINT_LINK.label });
    expect(link.getAttribute("href")).toBe(ENTRY_NATIONAL_POINT_LINK.href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
