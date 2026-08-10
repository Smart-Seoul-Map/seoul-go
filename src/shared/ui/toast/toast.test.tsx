import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AppButton } from "../button";
import { AppToastProvider, useAppToast } from ".";

function ToastActionTrigger({ children }: { children?: ReactNode }) {
  const { showToast } = useAppToast();

  return (
    <>
      <AppButton
        onClick={() =>
          showToast({
            actionLabel: "Undo",
            message: "Added to course",
            onAction: vi.fn(),
          })
        }
      >
        Show toast
      </AppButton>
      {children}
    </>
  );
}

describe("AppToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders toast content through a portal outside the app root", () => {
    const appRoot = document.getElementById("app");

    render(
      <div data-testid="page">
        <AppToastProvider>
          <ToastActionTrigger />
        </AppToastProvider>
      </div>,
      { container: appRoot ?? undefined }
    );

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByRole("status").textContent).toContain("Added to course");
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByTestId("page").querySelector(".AppToast")).toBeNull();
  });

  test("uses alert role for error toast", () => {
    function ErrorTrigger() {
      const { showToast } = useAppToast();

      return (
        <AppButton onClick={() => showToast({ message: "Could not save course", status: "error" })}>
          Show error
        </AppButton>
      );
    }

    render(
      <AppToastProvider>
        <ErrorTrigger />
      </AppToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    expect(screen.getByRole("alert").textContent).toContain("Could not save course");
  });

  test("runs the action callback and dismisses the toast when the action is clicked", () => {
    const handleAction = vi.fn();

    function ActionTrigger() {
      const { showToast } = useAppToast();

      return (
        <AppButton
          onClick={() =>
            showToast({
              actionLabel: "Undo",
              message: "Place removed",
              onAction: handleAction,
            })
          }
        >
          Show action toast
        </AppButton>
      );
    }

    render(
      <AppToastProvider>
        <ActionTrigger />
      </AppToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show action toast" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(handleAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("dismisses the toast after the configured duration", () => {
    function DurationTrigger() {
      const { showToast } = useAppToast();

      return (
        <AppButton onClick={() => showToast({ durationMs: 1000, message: "Range expanded" })}>
          Show short toast
        </AppButton>
      );
    }

    render(
      <AppToastProvider>
        <DurationTrigger />
      </AppToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show short toast" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  test("replaces the active toast with the latest toast request", () => {
    function QueueTrigger() {
      const { showToast } = useAppToast();

      return (
        <AppButton
          onClick={() => {
            showToast({ durationMs: 1000, message: "First notice" });
            showToast({ durationMs: 1000, message: "Second notice" });
          }}
        >
          Queue toasts
        </AppButton>
      );
    }

    render(
      <AppToastProvider>
        <QueueTrigger />
      </AppToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Queue toasts" }));

    expect(screen.getByRole("status").textContent).toContain("Second notice");
    expect(screen.queryByText("First notice")).toBeNull();
  });

  test("pauses auto dismiss while the toast is pressed", () => {
    function PauseTrigger() {
      const { showToast } = useAppToast();

      return (
        <AppButton onClick={() => showToast({ durationMs: 1000, message: "Still visible" })}>
          Show pausable toast
        </AppButton>
      );
    }

    render(
      <AppToastProvider>
        <PauseTrigger />
      </AppToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show pausable toast" }));
    fireEvent.pointerDown(screen.getByRole("status"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("status").textContent).toContain("Still visible");

    fireEvent.pointerUp(screen.getByRole("status"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  test("pauses auto dismiss while the pointer is over the toast", () => {
    function HoverTrigger() {
      const { showToast } = useAppToast();

      return (
        <AppButton onClick={() => showToast({ durationMs: 1000, message: "Pointer is over" })}>
          Show hover toast
        </AppButton>
      );
    }

    render(
      <AppToastProvider>
        <HoverTrigger />
      </AppToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show hover toast" }));
    fireEvent.pointerEnter(screen.getByRole("status"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("status").textContent).toContain("Pointer is over");

    fireEvent.pointerLeave(screen.getByRole("status"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });
});
