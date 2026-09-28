import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ComponentProps } from "react";
import type { EntryExplorationPage } from "@features/entry-exploration";

import { EntryExplorationRoute } from "./EntryExplorationRoute";

const onClose = vi.hoisted(() => vi.fn());
vi.mock("@features/entry-exploration", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/entry-exploration")>()),
  EntryExplorationPage: ({ renderPlacePanel }: ComponentProps<typeof EntryExplorationPage>) =>
    renderPlacePanel?.({ placeId: "hanok", open: true, onClose }),
}));
vi.mock("./useSubwayStationAvailability", () => ({
  useSubwayStationAvailability: () => ({ availabilityStatus: "idle" }),
}));

const originalWidth = window.innerWidth;
afterEach(() => {
  cleanup();
  onClose.mockClear();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
});

test.each([390, 1366])("provides a pointer-accessible card close action at %ipx", (width) => {
  act(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  });
  render(<EntryExplorationRoute />);
  const close = screen.getByRole("button", { name: "장소 정보 닫기" });
  expect(close.classList.contains("AppIconButton")).toBe(true);
  fireEvent.click(close);
  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.queryByText("탐방중 이런 정보를 만나요!") !== null).toBe(width >= 768);
});
