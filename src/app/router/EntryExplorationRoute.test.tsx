import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ComponentProps } from "react";
import type { EntryExplorationPage } from "@features/entry-exploration";

import { EntryExplorationRoute } from "./EntryExplorationRoute";
import { ENTRY_MODELED_TEST_PLACES } from "../../features/entry-exploration/testing/entryEditionFixtures";

const onClose = vi.hoisted(() => vi.fn());
const panelSelection = vi.hoisted(() => ({ placeId: null as string | null }));
vi.mock("@features/entry-exploration", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/entry-exploration")>()),
  EntryExplorationPage: ({
    renderPlacePanel,
    places,
  }: ComponentProps<typeof EntryExplorationPage>) =>
    renderPlacePanel?.({ placeId: panelSelection.placeId ?? places[0].id, open: true, onClose }),
}));
vi.mock("@features/places", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@features/places")>()),
  useSeoulEditionPlacesQuery: () => ({ data: ENTRY_MODELED_TEST_PLACES, isSuccess: true }),
}));
vi.mock("./useSubwayStationAvailability", () => ({
  useSubwayStationAvailability: () => ({ availabilityStatus: "idle" }),
}));

const originalWidth = window.innerWidth;
afterEach(() => {
  cleanup();
  onClose.mockClear();
  panelSelection.placeId = null;
  localStorage.clear();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
});

test.each([390, 1366])("restores the hanok information and external link at %ipx", (width) => {
  panelSelection.placeId = "hanok";
  act(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  });
  render(<EntryExplorationRoute />);
  expect(screen.getByRole("dialog", { name: "한옥체험" })).toBeTruthy();
  expect(screen.getByText(/서울의 공공한옥과 한옥체험 정보를 만나보세요/)).toBeTruthy();
  const link = screen.getByRole("link", { name: /한옥체험 지도 보기/ });
  expect(link.getAttribute("href")).toBe("https://map.seoul.go.kr/smgis2/short/6P5oo");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(screen.queryByText("탐방중 이런 정보를 만나요!") !== null).toBe(width >= 768);
  fireEvent.click(screen.getByRole("button", { name: "장소 정보 닫기" }));
  expect(onClose).toHaveBeenCalledOnce();
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
  expect(screen.queryByText(/20(25|26) · 서울에디션/) !== null).toBe(width >= 768);
});
