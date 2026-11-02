import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ENTRY_NATIONAL_POINT_LINK } from "../config/entryNationalPointLink";
import { EntryCollectedNumbersGuideDialog } from "./EntryCollectedNumbersGuideDialog";

afterEach(cleanup);

describe("EntryCollectedNumbersGuideDialog", () => {
  test("explains the grid numbers with a clue card that starts from the visited place", () => {
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "번호 안내" });
    const lines = Array.from(
      dialog.querySelectorAll(".entry-numbers-guide-line"),
      (line) => line.textContent
    );
    expect(lines).toEqual([
      "장소를 방문해 얻은 번호는",
      "서울탐방GO에서 탐방할 위치를 찾는 단서예요!",
    ]);
  });

  test("closes with the close button", () => {
    const onOpenChange = vi.fn();
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("closes when the backdrop is clicked", () => {
    const onOpenChange = vi.fn();
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("opens the national point number page in a new tab without sharing the opener", () => {
    render(<EntryCollectedNumbersGuideDialog open onOpenChange={vi.fn()} />);

    const link = screen.getByRole("link", { name: ENTRY_NATIONAL_POINT_LINK.label });
    expect(link.getAttribute("href")).toBe(ENTRY_NATIONAL_POINT_LINK.href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
