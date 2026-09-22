import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntrySlotOverlay } from "./EntrySlotOverlay";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
const handlers = {
  onSpin: vi.fn(),
  onClose: vi.fn(),
  onRetryLoad: vi.fn(),
  onViewportBoundsChange: vi.fn(),
};

describe("EntrySlotOverlay", () => {
  test("stays hidden during ordinary exploration", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "closed" }} />);
    expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
  });

  test("allows explicit spin and close with common buttons", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "ready" }} />);
    fireEvent.click(screen.getByRole("button", { name: "돌리기" }));
    expect(handlers.onSpin).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });

  test.each(["focusing", "spinning"] as const)(
    "prevents repeat input while %s but allows exit",
    (status) => {
      render(<EntrySlotOverlay {...handlers} state={{ status }} />);
      expect(
        screen
          .getByRole("button", { name: status === "spinning" ? "돌아가는 중" : "돌리기" })
          .hasAttribute("disabled")
      ).toBe(true);
      expect(screen.getByRole("button", { name: "슬롯 닫기" }).hasAttribute("disabled")).toBe(
        false
      );
    }
  );

  test("announces two digits in order including leading zero, and offers retry", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "result", result: "09" }} />);
    expect(screen.getByRole("status", { name: "뽑힌 숫자" }).textContent).toBe("09");
    expect(
      screen.getByRole("status", { name: "뽑힌 숫자" }).querySelectorAll(".AppBadge")
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "다시 돌리기" }));
    expect(handlers.onSpin).toHaveBeenCalled();
  });

  test("offers a model load retry without a false numeric result", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "error" }} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("status", { name: "뽑힌 숫자" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
    expect(handlers.onRetryLoad).toHaveBeenCalled();
  });

  test("Escape closes the active slot", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "ready" }} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handlers.onClose).toHaveBeenCalled();
  });

  test("reports the visible camera area on open and viewport resize", () => {
    let height = 320;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.classList.contains("entry-slot-header")) return new DOMRect(0, 0, 640, 56);
      if (this.classList.contains("entry-slot-controls"))
        return new DOMRect(100, height - 100, 440, 84);
      return new DOMRect(0, 0, 640, height);
    });
    const { unmount } = render(<EntrySlotOverlay {...handlers} state={{ status: "ready" }} />);
    expect(handlers.onViewportBoundsChange).toHaveBeenLastCalledWith({
      top: 56 / 320,
      bottom: 220 / 320,
    });
    height = 390;
    fireEvent(window, new Event("resize"));
    expect(handlers.onViewportBoundsChange).toHaveBeenLastCalledWith({
      top: 56 / 390,
      bottom: 290 / 390,
    });
    unmount();
    expect(handlers.onViewportBoundsChange).toHaveBeenLastCalledWith(null);
  });
});
