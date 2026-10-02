import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { LinkedPlacesContent, type LinkedNearbyPlace } from "./LinkedPlacesPanel";
import type { LinkedPlaceReference } from "../domain/linkedPlaceReference";

const refs: LinkedPlaceReference[] = [
  {
    id: "a",
    name: "해방촌 신흥시장",
    selectionYear: 2025,
    position: { lat: 37, lng: 127 },
    addedAt: "2026-01-01",
  },
  {
    id: "b",
    name: "리움미술관",
    selectionYear: 2026,
    position: { lat: 37, lng: 127 },
    addedAt: "2026-01-02",
  },
];
const places: LinkedNearbyPlace[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  sourceContentId: String(i),
  name: `연계 장소 ${i}`,
  themeId: "100032",
  themeName: "서울 미래유산",
  description: "목록 설명",
  districtName: "용산구",
  address: "",
  imageUrl: "",
  position: { lat: 37, lng: 127 },
}));
const defaults = {
  references: refs,
  selected: refs[0],
  places,
  isLoading: false,
  isError: false,
  onSelect: vi.fn(),
  onRetry: vi.fn(),
};
afterEach(cleanup);

test("shows image/year/name tabs and every nearby place without extra actions or distances", () => {
  render(<LinkedPlacesContent {...defaults} />);
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
  expect(screen.queryByText("목록 설명")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /지도에서|스탬프 보드|순서 변경/ })
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/직선거리|Step/)).not.toBeInTheDocument();
  expect(within(screen.getByRole("tabpanel")).getByText("연계 장소 11")).toBeVisible();
});
test("uses AppTabs keyboard selection", () => {
  const onSelect = vi.fn();
  render(<LinkedPlacesContent {...defaults} onSelect={onSelect} />);
  const tabs = screen.getAllByRole("tab");
  fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
  expect(onSelect).toHaveBeenCalledWith("b");
  expect(tabs[1]).toHaveFocus();
});
test("distinguishes loading, errors and empty results", () => {
  const onRetry = vi.fn();
  const view = render(<LinkedPlacesContent {...defaults} places={[]} isLoading />);
  expect(screen.getByRole("status")).toHaveTextContent("찾고 있어요");
  view.rerender(<LinkedPlacesContent {...defaults} places={[]} isError onRetry={onRetry} />);
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(onRetry).toHaveBeenCalledOnce();
  view.rerender(<LinkedPlacesContent {...defaults} places={[]} />);
  expect(screen.getByRole("status")).toHaveTextContent("장소가 없어요");
});
