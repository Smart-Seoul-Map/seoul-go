import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ENTRY_NATIONAL_POINT_LINK } from "../config/entryNationalPointLink";
import { EntryCollectedNumbersGuideDialog } from "./EntryCollectedNumbersGuideDialog";

afterEach(cleanup);

describe("EntryCollectedNumbersGuideDialog", () => {
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
