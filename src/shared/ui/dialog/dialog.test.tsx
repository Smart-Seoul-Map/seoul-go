import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AppButton } from "../button";
import { AppDialog } from ".";

describe("AppDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  test("renders dialog content through a portal outside the app root", () => {
    const appRoot = document.getElementById("app");

    render(
      <div data-testid="page">
        <AppDialog open title="District selected">
          Yongsan is ready.
        </AppDialog>
      </div>,
      { container: appRoot ?? undefined }
    );

    expect(screen.getByRole("dialog", { name: "District selected" })).toBeTruthy();
    expect(within(screen.getByTestId("page")).queryByRole("dialog")).toBeNull();
  });

  test("connects dialog title and description for assistive technology", () => {
    render(
      <AppDialog description="Choose the next action." open title="District selected">
        Yongsan is ready.
      </AppDialog>
    );

    const dialog = screen.getByRole("dialog", { name: "District selected" });

    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Choose the next action.")).toBeTruthy();
  });

  test("supports a guide appearance without changing dialog semantics", () => {
    render(
      <AppDialog appearance="guide" open title="Guide title">
        Guide content
      </AppDialog>
    );

    const dialog = screen.getByRole("dialog", { name: "Guide title" });

    expect(dialog.getAttribute("data-appearance")).toBe("guide");
  });

  test("does not close when the backdrop is clicked by default", () => {
    const handleOpenChange = vi.fn();

    render(
      <AppDialog onOpenChange={handleOpenChange} open title="District selected">
        Yongsan is ready.
      </AppDialog>
    );

    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));

    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  test("can opt into closing when the backdrop is clicked", () => {
    const handleOpenChange = vi.fn();

    render(
      <AppDialog
        closeOnInteractOutside
        onOpenChange={handleOpenChange}
        open
        title="District selected"
      >
        Yongsan is ready.
      </AppDialog>
    );

    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  test("closes on Escape by default", () => {
    const handleOpenChange = vi.fn();

    render(
      <AppDialog onOpenChange={handleOpenChange} open title="District selected">
        Yongsan is ready.
      </AppDialog>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  test("focuses the last action when mounted", () => {
    render(
      <AppDialog
        actions={
          <>
            <AppButton variant="secondary">Retry</AppButton>
            <AppButton variant="primary">Explore</AppButton>
          </>
        }
        open
        title="District selected"
      >
        Yongsan is ready.
      </AppDialog>
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Explore" }));
  });

  test("renders optional back and close actions with accessible names", () => {
    render(
      <AppDialog
        backAction={{ ariaLabel: "Back to exploration", children: "←", onClick: vi.fn() }}
        closeAction={{ ariaLabel: "Close result", children: "×", onClick: vi.fn() }}
        open
        title="District selected"
      >
        Yongsan is ready.
      </AppDialog>
    );

    expect(screen.getByRole("button", { name: "Back to exploration" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close result" })).toBeTruthy();
  });
});
