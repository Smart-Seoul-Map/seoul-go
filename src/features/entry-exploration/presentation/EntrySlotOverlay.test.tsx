import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntrySlotOverlay } from "./EntrySlotOverlay";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
const handlers = { onClose: vi.fn(), onViewportBoundsChange: vi.fn() };

describe("EntrySlotOverlay", () => {
  test("stays hidden during ordinary exploration", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "closed" }} />);
    expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
  });

  test.each(["loading", "covering", "focusing", "lever", "spinning"] as const)(
    "locks close and Escape during %s without offering a spin button",
    (status) => {
      render(<EntrySlotOverlay {...handlers} state={{ status }} />);
      expect(screen.getByRole("button", { name: "슬롯 닫기" }).hasAttribute("disabled")).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handlers.onClose).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: /돌리기/ })).toBeNull();
      expect(screen.getByRole("status", { name: "뽑힌 숫자" }).getAttribute("aria-busy")).toBe(
        "true"
      );
    }
  );

  test("shows the assigned digits without retry and permits close only after the result", () => {
    render(<EntrySlotOverlay {...handlers} state={{ status: "result", result: "40" }} />);
    expect(screen.getByRole("status", { name: "뽑힌 숫자" }).textContent).toBe("40");
    expect(screen.queryByRole("button", { name: /돌리기/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
    expect(handlers.onClose).toHaveBeenCalledOnce();
  });

  test("uses the stored result as a closable fallback without restarting the draw", () => {
    render(
      <EntrySlotOverlay
        {...handlers}
        state={{ status: "result", result: "57", isFallback: true }}
      />
    );
    expect(screen.getByRole("alert").textContent).toContain("57");
    expect(screen.getByRole("button", { name: "슬롯 닫기" }).hasAttribute("disabled")).toBe(false);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handlers.onClose).toHaveBeenCalledOnce();
  });

  test("keeps keyboard focus inside the active slot until it closes", () => {
    const { rerender } = render(<EntrySlotOverlay {...handlers} state={{ status: "spinning" }} />);
    const region = screen.getByRole("region", { name: "숫자 슬롯" });
    expect(document.activeElement).toBe(region);
    fireEvent.keyDown(region, { key: "Tab" });
    expect(document.activeElement).toBe(region);
    rerender(<EntrySlotOverlay {...handlers} state={{ status: "result", result: "40" }} />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "슬롯 닫기" }));
  });

  test("reports camera bounds on open and viewport resize", () => {
    let height = 320;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.classList.contains("entry-slot-header")) return new DOMRect(0, 0, 640, 56);
      if (this.classList.contains("entry-slot-controls"))
        return new DOMRect(100, height - 100, 440, 84);
      return new DOMRect(0, 0, 640, height);
    });
    const { unmount } = render(<EntrySlotOverlay {...handlers} state={{ status: "focusing" }} />);
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
