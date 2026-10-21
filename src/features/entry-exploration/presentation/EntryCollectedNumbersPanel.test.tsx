import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { getEntryNumberRewardRows } from "../domain/entryNumberReward";
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";

vi.mock("../../../assets/icons/dices.svg", () => ({
  default: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e",
}));

const HAEBANGCHON_ROWS = getEntryNumberRewardRows([
  {
    placeId: "smart-seoul:1786321258890:25_edition25_21",
    placeName: "해방촌신흥시장",
    east: 54,
    north: 49,
  },
]);
const RIUM_ROWS = getEntryNumberRewardRows([
  {
    placeId: "smart-seoul:1786321258890:26_edition25_21",
    placeName: "리움미술관",
    east: 55,
    north: 48,
  },
]);

afterEach(cleanup);

describe("EntryCollectedNumbersPanel", () => {
  test("replaces the trigger button with a plain title once open", () => {
    render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    fireEvent.click(getTrigger(2));

    const panel = screen.getByRole("region", { name: "번호" });
    expect(screen.queryByRole("button", { name: /내 번호 열기/ })).toBeNull();
    expect(within(panel).getByText("번호").closest("button")).toBeNull();
    expect(screen.getByRole("button", { name: "번호 안내" })).toBeTruthy();
    expect(panel.querySelector(".entry-collected-numbers-icon")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));
    expect(getTrigger(2)).toBeTruthy();
    expect(document.activeElement).toBe(getTrigger(2));
  });

  test("opens the notice dialog from the ! button and closes it without closing the panel", () => {
    render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    fireEvent.click(getTrigger(2));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "번호 안내" }));
    expect(screen.getByRole("dialog", { name: "내 번호" })).toBeTruthy();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
  });

  test("retains the animating content but excludes it from interaction while collapsed", () => {
    const { container } = render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    const body = container.querySelector(".entry-collected-numbers-body");
    expect(body?.getAttribute("aria-hidden")).toBe("true");
    expect(body?.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("button", { name: "내 번호 접기" })).toBeNull();

    fireEvent.click(getTrigger(2));
    expect(container.querySelector(".entry-collected-numbers-body")).toBe(body);
    expect(body?.hasAttribute("inert")).toBe(false);
    expect(screen.getByRole("list", { name: "획득한 숫자" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));
    expect(body?.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("uses supporting text for the visible number title in both collapsed and expanded states", () => {
    render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    const collapsedTitle = within(getTrigger(2)).getByText("번호");
    expect(collapsedTitle.classList.contains("AppText")).toBe(true);
    expect(collapsedTitle.getAttribute("data-role")).toBe("supporting");

    fireEvent.click(getTrigger(2));
    const panel = screen.getByRole("region", { name: "번호" });
    const expandedTitle = within(panel).getByText("번호");
    expect(expandedTitle.classList.contains("AppText")).toBe(true);
    expect(expandedTitle.getAttribute("data-role")).toBe("supporting");
    expect(panel.getAttribute("aria-labelledby")).toBe(expandedTitle.id);
  });

  test("keeps the dice mask valid when Vite inlines the SVG", () => {
    render(<EntryCollectedNumbersPanel rows={[]} />);
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
        <EntryCollectedNumbersPanel rows={[]} />
      </>
    );

    expect(document.activeElement).toBe(scene);
    expect(screen.queryByRole("region", { name: "번호" })).toBeNull();
  });

  test("shows an empty state without placeholder numbers", () => {
    render(<EntryCollectedNumbersPanel rows={[]} />);
    fireEvent.click(getTrigger(0));

    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
    expect(screen.getByText("아직 획득한 번호가 없어요.")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("shows each place name with one number per row in order as a non-selectable list", () => {
    render(<EntryCollectedNumbersPanel rows={[...HAEBANGCHON_ROWS, ...RIUM_ROWS]} />);
    fireEvent.click(getTrigger(4));

    const panel = screen.getByRole("region", { name: "번호" });
    const list = within(panel).getByRole("list", { name: "획득한 숫자" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((row) => row.textContent)
    ).toEqual(["해방촌신흥시장|54", "해방촌신흥시장|49", "리움미술관|55", "리움미술관|48"]);
    expect(within(list).getAllByText("해방촌신흥시장")).toHaveLength(2);
    expect(within(list).queryByText("추첨 번호")).toBeNull();
    expect(within(list).queryByRole("button")).toBeNull();
    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
    expect(panel.getAttribute("aria-modal")).toBeNull();
  });

  test("shows two rows when a place has the same east and north numbers", () => {
    const rows = getEntryNumberRewardRows([
      {
        placeId: "smart-seoul:1786321258890:26_edition25_99",
        placeName: "같은 번호 장소",
        east: 52,
        north: 52,
      },
    ]);
    render(<EntryCollectedNumbersPanel rows={rows} />);
    fireEvent.click(getTrigger(2));

    expect(screen.getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      "같은 번호 장소|52",
      "같은 번호 장소|52",
    ]);
  });

  test("opens automatically when the parent adds rows and counts rows instead of places", () => {
    const { rerender } = render(<EntryCollectedNumbersPanel rows={[]} />);
    rerender(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);

    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("updates the count and list when the parent supplies another result", () => {
    const { rerender } = render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    fireEvent.click(getTrigger(2));
    rerender(<EntryCollectedNumbersPanel rows={[...HAEBANGCHON_ROWS, ...RIUM_ROWS]} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("55")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));
    expect(getTrigger(4)).toBeTruthy();
  });

  test("closes with X and returns focus to the trigger without losing numbers", () => {
    render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    fireEvent.click(getTrigger(2));
    fireEvent.click(screen.getByRole("button", { name: "내 번호 접기" }));

    expect(document.activeElement).toBe(getTrigger(2));
    expect(screen.queryByRole("region", { name: "번호" })).toBeNull();
    fireEvent.click(getTrigger(2));
    expect(screen.getByText("54")).toBeTruthy();
  });

  test("closes with Escape from the panel and returns focus", () => {
    render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    fireEvent.click(getTrigger(2));
    fireEvent.keyDown(screen.getByRole("region", { name: "번호" }), { key: "Escape" });

    expect(screen.queryByRole("region", { name: "번호" })).toBeNull();
    expect(document.activeElement).toBe(getTrigger(2));
  });

  test("leaves the background interactive without closing on an outside click", () => {
    const onBackgroundClick = vi.fn();
    render(
      <>
        <button onClick={onBackgroundClick}>탐방 화면</button>
        <EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />
      </>
    );
    fireEvent.click(getTrigger(2));
    fireEvent.click(screen.getByRole("button", { name: "탐방 화면" }));

    expect(onBackgroundClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
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
        <EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />
      </div>
    );
    fireEvent.pointerDown(getTrigger(2));
    fireEvent.click(getTrigger(2));
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

  test("opens when the dart view starts and stays open while the character walks to the map", () => {
    const { rerender } = render(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    rerender(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} isDartViewActive />);

    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
    expect(document.activeElement).toBe(document.body);

    rerender(
      <EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} isDartViewActive isCharacterMoving />
    );
    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();

    rerender(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} />);
    expect(screen.getByRole("region", { name: "번호" })).toBeTruthy();
    rerender(<EntryCollectedNumbersPanel rows={HAEBANGCHON_ROWS} isCharacterMoving />);
    expect(screen.queryByRole("region", { name: "번호" })).toBeNull();
  });
});

function getTrigger(count: number): HTMLElement {
  return screen.getByRole("button", { name: `내 번호 열기, ${count}개 획득` });
}
