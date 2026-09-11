import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AppButton } from "../button";
import { createRef } from "react";
import { AppResponsivePanel } from ".";
import type { AppResponsivePanelRootProps } from "./panelTypes";

function Panel(props: Omit<AppResponsivePanelRootProps, "children">) {
  return (
    <AppResponsivePanel.Root skipAnimation {...props}>
      <AppResponsivePanel.Trigger asChild>
        <AppButton>Open panel</AppButton>
      </AppResponsivePanel.Trigger>
      <AppResponsivePanel.Content title="Place" description="Place details" showHandle>
        <AppResponsivePanel.Body>
          <input aria-label="Notes" />
        </AppResponsivePanel.Body>
        <AppResponsivePanel.Footer>
          <AppResponsivePanel.CloseButton>Done</AppResponsivePanel.CloseButton>
        </AppResponsivePanel.Footer>
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}

function resize(width: number) {
  act(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  });
}

beforeEach(() => resize(1200));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AppResponsivePanel", () => {
  test("floating appearance preserves modal behavior and content across mobile resizing", () => {
    const { container } = render(<Panel sidePanelRootProps={{ presentation: "floating" }} />);
    const trigger = screen.getByRole("button", { name: "Open panel" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(dialog.dataset.appearance).toBe("floating");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(container.inert).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Keep floating content" },
    });
    resize(375);
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(dialog.dataset.presentation).toBe("bottom-sheet");
    expect(dialog.dataset.appearance).toBeUndefined();
    expect(screen.getByRole("button", { name: "패널 높이 조절" })).toBeTruthy();
    resize(1200);
    expect(dialog.dataset.appearance).toBe("floating");
    expect((screen.getByLabelText("Notes") as HTMLInputElement).value).toBe(
      "Keep floating content"
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(container.inert).toBe(false);
  });

  test("keeps the default attached appearance and floating outside-click dismissal", () => {
    const { rerender } = render(<Panel defaultOpen />);
    expect(screen.getByRole("dialog").dataset.appearance).toBe("attached");
    rerender(
      <Panel defaultOpen sidePanelRootProps={{ presentation: "floating", direction: "left" }} />
    );
    expect(screen.getByRole("dialog").dataset.appearance).toBe("floating");
    fireEvent.click(document.querySelector(".AppResponsivePanelBackdrop")!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("preserves both refs when composing a trigger with AppButton", () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const buttonRef = createRef<HTMLButtonElement>();
    render(
      <AppResponsivePanel.Root>
        <AppResponsivePanel.Trigger ref={triggerRef} asChild>
          <AppButton ref={buttonRef}>Ref trigger</AppButton>
        </AppResponsivePanel.Trigger>
      </AppResponsivePanel.Root>
    );
    const button = screen.getByRole("button", { name: "Ref trigger" });
    expect(triggerRef.current).toBe(button);
    expect(buttonRef.current).toBe(button);
  });

  test("keeps an initially open child panel above its initially open parent", () => {
    render(
      <AppResponsivePanel.Root defaultOpen skipAnimation>
        <AppResponsivePanel.Content title="Parent">
          <Panel defaultOpen />
        </AppResponsivePanel.Content>
      </AppResponsivePanel.Root>
    );
    expect(screen.getByRole("dialog", { name: "Place" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "Parent" })).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Parent" })).toBeTruthy();
  });
  test("claims a downward touch drag from an unscrolled body", () => {
    resize(375);
    render(<Panel defaultOpen />);
    const dialog = screen.getByRole("dialog");
    const body = dialog.querySelector<HTMLElement>(".AppResponsivePanelBody")!;
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ height: 400 } as DOMRect);
    fireEvent.pointerDown(body, {
      pointerId: 1,
      pointerType: "touch",
      clientY: 200,
      clientX: 100,
      button: 0,
      isPrimary: true,
    });
    fireEvent.touchStart(body, { touches: [{ identifier: 0, clientY: 200, clientX: 100 }] });
    const cancelled = !fireEvent.touchMove(body, {
      touches: [{ identifier: 0, clientY: 450, clientX: 100 }],
    });
    expect(cancelled).toBe(true);
    expect(dialog.style.getPropertyValue("--panel-drag-y")).toBe("250px");
    fireEvent.touchEnd(body, { changedTouches: [{ identifier: 0, clientY: 450, clientX: 100 }] });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  test("expands snap height during an upward drag without leaving a gap below the sheet", () => {
    resize(375);
    render(<Panel defaultOpen bottomSheetRootProps={{ snapPoints: ["200px", "400px"] }} />);
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ height: 200 } as DOMRect);
    fireEvent.pointerDown(screen.getByRole("button", { name: "패널 높이 조절" }), {
      pointerId: 1,
      clientY: 400,
      clientX: 100,
      button: 0,
      isPrimary: true,
    });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 250, clientX: 100 });
    expect(dialog.style.getPropertyValue("--panel-drag-height")).toBe("350px");
    expect(dialog.style.getPropertyValue("--panel-drag-y")).toBe("0px");
    fireEvent.pointerUp(document, { pointerId: 1 });
    expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("400px");
  });
  test("opens through an existing AppButton and restores focus when closed", () => {
    const { container } = render(<Panel />);
    const trigger = screen.getByRole("button", { name: "Open panel" });
    trigger.focus();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Place" });
    expect(container.contains(dialog)).toBe(false);
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("reports controlled changes without overriding the parent's open value", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Panel open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Open panel" }));
    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: "trigger" });
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Panel open onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "escapeKeyDown" });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  test("keeps form state and open state when resizing from side panel to bottom sheet", () => {
    render(<Panel defaultOpen />);
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Keep this" } });
    expect(screen.getByRole("dialog").dataset.presentation).toBe("side-panel");
    resize(375);
    expect(screen.getByRole("dialog").dataset.presentation).toBe("bottom-sheet");
    expect((screen.getByLabelText("Notes") as HTMLInputElement).value).toBe("Keep this");
    resize(1200);
    expect((screen.getByLabelText("Notes") as HTMLInputElement).value).toBe("Keep this");
  });

  test("traps modal focus and restores background interactivity and scrolling", () => {
    document.body.style.overflow = "auto";
    const { container, unmount } = render(<Panel defaultOpen />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(container.inert).toBe(true);
    const last = screen.getByRole("button", { name: "Done" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "닫기" }));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    unmount();
    expect(container.inert).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  test("does not trap focus, block the page or render a backdrop when non-modal", () => {
    const { container } = render(<Panel defaultOpen modal={false} />);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBeNull();
    expect(container.inert).not.toBe(true);
    expect(document.querySelector(".AppResponsivePanelBackdrop")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Open panel" });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });

  test("dismissible=false blocks Escape and outside clicks but allows an explicit close", () => {
    render(<Panel defaultOpen dismissible={false} />);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(document.querySelector(".AppResponsivePanelBackdrop")!);
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("outside clicks dismiss while clicks inside do not", () => {
    render(<Panel defaultOpen />);
    fireEvent.click(screen.getByLabelText("Notes"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(document.querySelector(".AppResponsivePanelBackdrop")!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("asChild preserves the child's event cancellation", () => {
    render(
      <AppResponsivePanel.Root>
        <AppResponsivePanel.Trigger asChild>
          <button onClick={(event) => event.preventDefault()}>Prevent</button>
        </AppResponsivePanel.Trigger>
        <AppResponsivePanel.Content title="Cancelled">Content</AppResponsivePanel.Content>
      </AppResponsivePanel.Root>
    );
    fireEvent.click(screen.getByRole("button", { name: "Prevent" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("Escape only dismisses the topmost panel and keeps its parent modal locked", () => {
    render(
      <AppResponsivePanel.Root defaultOpen skipAnimation>
        <AppResponsivePanel.Content title="Parent">
          <Panel />
        </AppResponsivePanel.Content>
      </AppResponsivePanel.Root>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open panel" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Place" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "Parent" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("cycles mobile snap points and dismisses after the final point", () => {
    resize(375);
    const onOpenChange = vi.fn();
    render(
      <Panel
        defaultOpen
        onOpenChange={onOpenChange}
        bottomSheetRootProps={{ snapPoints: ["200px", "400px", 1] }}
      />
    );
    const handle = screen.getByRole("button", { name: "패널 높이 조절" });
    fireEvent.click(handle);
    expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("400px");
    fireEvent.click(handle);
    expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("100dvh");
    fireEvent.click(handle);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "handleClickOnLastSnapPoint" });
  });

  test("keeps a mobile sheet open after the final snap point when final click dismissal is disabled", () => {
    resize(375);
    const onOpenChange = vi.fn();
    render(
      <Panel
        defaultOpen
        onOpenChange={onOpenChange}
        bottomSheetRootProps={{
          closeOnFinalSnapClick: false,
          snapPoints: ["200px", "400px"],
        }}
      />
    );
    const handle = screen.getByRole("button", { name: "패널 높이 조절" });
    fireEvent.click(handle);
    expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("400px");
    fireEvent.click(handle);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalledWith(false, {
      reason: "handleClickOnLastSnapPoint",
    });
  });

  test("preserves a controlled snap point until the parent updates it", () => {
    resize(375);
    const setActiveSnapPoint = vi.fn();
    render(
      <Panel
        defaultOpen
        bottomSheetRootProps={{
          snapPoints: ["200px", "400px"],
          activeSnapPoint: "200px",
          setActiveSnapPoint,
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "패널 높이 조절" }));
    expect(setActiveSnapPoint).toHaveBeenCalledWith("400px");
    expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("200px");
  });

  test("keeps content mounted for its closing animation then removes it", () => {
    render(<Panel defaultOpen skipAnimation={false} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }));
    expect(dialog.isConnected).toBe(true);
    expect(dialog.dataset.state).toBe("closed");
    // JSDOM has no AnimationEvent constructor, so React registers the WebKit event.
    fireEvent(dialog, new Event("webkitAnimationEnd", { bubbles: true }));
    expect(dialog.isConnected).toBe(false);
  });

  test("closes a mobile sheet after dragging the handle down", () => {
    resize(375);
    const onOpenChange = vi.fn();
    render(
      <Panel defaultOpen onOpenChange={onOpenChange} bottomSheetRootProps={{ handleOnly: true }} />
    );
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ height: 400 } as DOMRect);
    fireEvent.pointerDown(screen.getByRole("button", { name: "패널 높이 조절" }), {
      pointerId: 1,
      clientY: 200,
      clientX: 100,
      button: 0,
      isPrimary: true,
    });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 450, clientX: 100 });
    expect(dialog.style.getPropertyValue("--panel-drag-y")).toBe("250px");
    fireEvent.pointerUp(document, { pointerId: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: "drag" });
  });

  test("does not hijack scrolling or close on a cancelled gesture", () => {
    resize(375);
    render(<Panel defaultOpen />);
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ height: 400 } as DOMRect);
    const body = dialog.querySelector<HTMLElement>(".AppResponsivePanelBody")!;
    body.scrollTop = 50;
    fireEvent.pointerDown(body, {
      pointerId: 1,
      clientY: 200,
      clientX: 100,
      button: 0,
      isPrimary: true,
    });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 500, clientX: 100 });
    fireEvent.pointerUp(document, { pointerId: 1 });
    expect(screen.getByRole("dialog")).toBeTruthy();
    body.scrollTop = 0;
    fireEvent.pointerDown(body, {
      pointerId: 2,
      clientY: 200,
      clientX: 100,
      button: 0,
      isPrimary: true,
    });
    fireEvent.pointerMove(document, { pointerId: 2, clientY: 500, clientX: 100 });
    fireEvent.pointerCancel(document, { pointerId: 2 });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(dialog.style.getPropertyValue("--panel-drag-y")).toBe("");
  });

  test("blocks dragging when non-dismissible and outside the handle when handleOnly", () => {
    resize(375);
    const { rerender } = render(<Panel defaultOpen dismissible={false} />);
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ height: 400 } as DOMRect);
    const handle = screen.getByRole("button", { name: "패널 높이 조절" });
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 200, button: 0, isPrimary: true });
    fireEvent.pointerMove(document, { pointerId: 1, clientY: 600 });
    fireEvent.pointerUp(document, { pointerId: 1 });
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(<Panel defaultOpen bottomSheetRootProps={{ handleOnly: true }} />);
    fireEvent.pointerDown(dialog, { pointerId: 2, clientY: 200, button: 0, isPrimary: true });
    fireEvent.pointerMove(document, { pointerId: 2, clientY: 600 });
    fireEvent.pointerUp(document, { pointerId: 2 });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
