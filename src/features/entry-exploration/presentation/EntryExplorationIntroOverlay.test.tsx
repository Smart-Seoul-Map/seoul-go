import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { EntryExplorationIntroOverlay } from "./EntryExplorationIntroOverlay";

afterEach(cleanup);

test("starts through the image hotspot without a separate visible button label", () => {
  const onStart = vi.fn();
  render(<EntryExplorationIntroOverlay disabled={false} onStart={onStart} />);
  expect(screen.getByRole("img", { name: "서울탐방 GO" })).toBeTruthy();
  const start = screen.getByRole("button", { name: "탐방 시작" });
  expect(start.textContent).toBe("");
  expect(start.classList.contains("entry-exploration-intro-start")).toBe(true);
  expect(screen.getAllByRole("button")).toHaveLength(1);
  fireEvent.click(start);
  expect(onStart).toHaveBeenCalledOnce();
});

test("blocks the image hotspot until ready and preserves retry handling", () => {
  const onStart = vi.fn();
  const { rerender } = render(<EntryExplorationIntroOverlay disabled onStart={onStart} />);
  const start = screen.getByRole("button", { name: "탐방 시작" });
  expect(start.hasAttribute("disabled")).toBe(true);
  fireEvent.click(start);
  expect(onStart).not.toHaveBeenCalled();
  rerender(
    <EntryExplorationIntroOverlay
      disabled={false}
      onStart={onStart}
      actionLabel="장소 다시 불러오기"
    />
  );
  const retry = screen.getByRole("button", { name: "장소 다시 불러오기" });
  expect(retry.hasAttribute("disabled")).toBe(false);
  fireEvent.click(retry);
  expect(onStart).toHaveBeenCalledOnce();
});
