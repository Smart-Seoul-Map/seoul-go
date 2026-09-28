import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";

vi.mock("../../../assets/dices.svg", () => ({
  default: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e",
}));

afterEach(cleanup);

describe("EntryCollectedNumbersPanel", () => {
  test("expands the existing header without replacing its button, icon, or title", () => {
    render(<EntryCollectedNumbersPanel numbers={[40]} />);
    const trigger = getTrigger(1);
    const icon = trigger.querySelector(".entry-collected-numbers-icon");
    const title = within(trigger).getByText("내 번호");

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "내 번호 접기, 1개 획득" })).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.querySelector(".entry-collected-numbers-icon")).toBe(icon);
    expect(within(trigger).getByText("내 번호")).toBe(title);

    fireEvent.click(trigger);
    expect(getTrigger(1)).toBe(trigger);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("retains the animating content but excludes it from interaction while collapsed", () => {
    const { container } = render(<EntryCollectedNumbersPanel numbers={[40]} />);
    const body = container.querySelector(".entry-collected-numbers-body");
    expect(body?.getAttribute("aria-hidden")).toBe("true");
    expect(body?.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("button", { name: "내 번호 접기" })).toBeNull();

    fireEvent.click(getTrigger(1));
    expect(container.querySelector(".entry-collected-numbers-body")).toBe(body);
    expect(body?.hasAttribute("inert")).toBe(false);
    expect(screen.getByRole("list", { name: "획득한 숫자" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));
    expect(body?.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("uses supporting text for the title in both collapsed and expanded states", () => {
    render(<EntryCollectedNumbersPanel numbers={[40]} />);
    const collapsedTitle = within(getTrigger(1)).getByText("내 번호");
    expect(collapsedTitle.classList.contains("AppText")).toBe(true);
    expect(collapsedTitle.getAttribute("data-role")).toBe("supporting");

    fireEvent.click(getTrigger(1));
    const panel = screen.getByRole("region", { name: "내 번호" });
    const expandedTitle = within(panel).getByText("내 번호");
    expect(expandedTitle.classList.contains("AppText")).toBe(true);
    expect(expandedTitle.getAttribute("data-role")).toBe("supporting");
    expect(panel.getAttribute("aria-labelledby")).toBe(expandedTitle.id);
  });

  test("keeps the dice mask valid when Vite inlines the SVG", () => {
    render(<EntryCollectedNumbersPanel numbers={[]} />);
    const icon = getTrigger(0).querySelector<HTMLElement>(".entry-collected-numbers-icon");

    expect(icon?.style.maskImage).toBe(
      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e\")"
    );
  });

  test("starts collapsed without taking focus from the scene", () => {
    const { rerender } = render(<button autoFocus>탐방 화면</button>);
    const scene = screen.getByRole("button", { name: "탐방 화면" });
    rerender(
      <>
        <button autoFocus>탐방 화면</button>
        <EntryCollectedNumbersPanel numbers={[]} />
      </>
    );

    expect(document.activeElement).toBe(scene);
    expect(getTrigger(0).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region", { name: "내 번호" })).toBeNull();
  });

  test("shows an empty state without placeholder numbers", () => {
    render(<EntryCollectedNumbersPanel numbers={[]} />);
    fireEvent.click(getTrigger(0));

    expect(screen.getByRole("region", { name: "내 번호" })).toBeTruthy();
    expect(screen.getByText("아직 획득한 번호가 없어요.")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("shows all acquired numbers in order as a non-selectable list", () => {
    render(<EntryCollectedNumbersPanel numbers={[40, 57, 65]} />);
    fireEvent.click(getTrigger(3));

    const panel = screen.getByRole("region", { name: "내 번호" });
    const list = within(panel).getByRole("list", { name: "획득한 숫자" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((row) => row.textContent)
    ).toEqual(["추첨 번호40", "추첨 번호57", "추첨 번호65"]);
    expect(within(list).queryByRole("button")).toBeNull();
    expect(within(panel).getByLabelText("3개 획득")).toBeTruthy();
    expect(panel.getAttribute("aria-modal")).toBeNull();
  });

  test("updates the count and list when the parent supplies another result", () => {
    const { rerender } = render(<EntryCollectedNumbersPanel numbers={[40]} />);
    fireEvent.click(getTrigger(1));
    rerender(<EntryCollectedNumbersPanel numbers={[40, 57]} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("57")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));
    expect(getTrigger(2)).toBeTruthy();
  });

  test("closes with X and returns focus to the trigger without losing numbers", () => {
    render(<EntryCollectedNumbersPanel numbers={[40]} />);
    fireEvent.click(getTrigger(1));
    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));

    expect(document.activeElement).toBe(getTrigger(1));
    expect(screen.queryByRole("region", { name: "내 번호" })).toBeNull();
    fireEvent.click(getTrigger(1));
    expect(screen.getByText("40")).toBeTruthy();
  });

  test("closes with Escape from the panel and returns focus", () => {
    render(<EntryCollectedNumbersPanel numbers={[40]} />);
    fireEvent.click(getTrigger(1));
    fireEvent.keyDown(screen.getByRole("region", { name: "내 번호" }), { key: "Escape" });

    expect(screen.queryByRole("region", { name: "내 번호" })).toBeNull();
    expect(document.activeElement).toBe(getTrigger(1));
  });

  test("leaves the background interactive without closing on an outside click", () => {
    const onBackgroundClick = vi.fn();
    render(
      <>
        <button onClick={onBackgroundClick}>탐방 화면</button>
        <EntryCollectedNumbersPanel numbers={[40]} />
      </>
    );
    fireEvent.click(getTrigger(1));
    fireEvent.click(screen.getByRole("button", { name: "탐방 화면" }));

    expect(onBackgroundClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("region", { name: "내 번호" })).toBeTruthy();
  });

  test("isolates panel input but lets key releases reach movement cleanup", () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    const onWheel = vi.fn();
    render(
      <div
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPointerDown={onPointerDown}
        onClick={onClick}
        onWheel={onWheel}
      >
        <EntryCollectedNumbersPanel numbers={[40]} />
      </div>
    );
    fireEvent.pointerDown(getTrigger(1));
    fireEvent.click(getTrigger(1));
    const list = screen.getByRole("list", { name: "획득한 숫자" });
    expect(fireEvent.keyDown(list, { key: "ArrowDown" })).toBe(true);
    expect(fireEvent.wheel(list, { deltaY: 100 })).toBe(true);
    fireEvent.keyUp(list, { key: "w" });

    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onPointerDown).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(onWheel).not.toHaveBeenCalled();
    expect(onKeyUp).toHaveBeenCalledOnce();
  });
});

function getTrigger(count: number): HTMLElement {
  return screen.getByRole("button", { name: `내 번호 열기, ${count}개 획득` });
}
