import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { MapPlaceDetailPanel } from "./MapPlaceDetailPanel";

const originalWidth = window.innerWidth;
const place = {
  title: "해방촌 신흥시장",
  selectionYear: 2025,
  description: "시장 골목의 공방과 가게를 만나는 장소",
  image: { src: "/market.jpg", alt: "시장 대표 이미지" },
};

function resize(width: number) {
  act(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  });
}

afterEach(() => {
  cleanup();
  resize(originalWidth);
});

test.each([390, 1366])("%ipx에서 제목과 검색은 헤더, 주요 액션은 푸터에 둔다", (width) => {
  resize(width);
  const onClose = vi.fn();
  const onAddToCourse = vi.fn();
  render(<MapPlaceDetailPanel place={place} onClose={onClose} onAddToCourse={onAddToCourse} />);
  const dialog = screen.getByRole("dialog", { name: place.title });
  const title = within(dialog).getByRole("heading", { name: place.title });
  expect(title.closest(".AppResponsivePanelHeader")).not.toBeNull();
  expect(within(dialog).getAllByRole("heading", { name: place.title })).toHaveLength(1);
  const search = within(dialog).getByRole("button", { name: `${place.title} 검색` });
  expect(within(title.closest(".AppResponsivePanelHeader")!).getByText("2025")).toHaveClass(
    "AppBadge-content"
  );
  const yearBadge = within(dialog).getByText("2025").closest(".AppBadge");
  expect(yearBadge).toHaveAttribute("data-size", width === 390 ? "number-sm" : "number-md");
  expect(yearBadge).toHaveAttribute("data-tone", "info");
  expect(yearBadge).toHaveAttribute("data-variant", "solid");
  expect(search.closest(".AppResponsivePanelBody")).toBeNull();
  const add = within(dialog).getByRole("button", { name: "스탬프/코스 추가" });
  expect(add.closest(".AppResponsivePanelFooter")).not.toBeNull();
  expect(add.closest(".AppResponsivePanelBody")).toBeNull();
  fireEvent.click(add);
  expect(onAddToCourse).toHaveBeenCalledOnce();
  fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }));
  expect(onClose).toHaveBeenCalledOnce();
});

test("검색 버튼을 누르면 네이버·구글 이미지 검색 목록이 열리고 선택하면 새 탭으로 연다", () => {
  resize(1366);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  render(<MapPlaceDetailPanel place={place} onClose={vi.fn()} />);
  const search = screen.getByRole("button", { name: `${place.title} 검색` });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  fireEvent.click(search);
  expect(search).toHaveAttribute("aria-expanded", "true");
  const items = within(screen.getByRole("menu")).getAllByRole("menuitem");
  expect(items.map((item) => item.textContent)).toEqual(["네이버 검색", "구글 이미지 검색"]);
  fireEvent.click(items[1]);
  const url = new URL(open.mock.calls[0][0] as string);
  expect(url.hostname).toBe("www.google.com");
  expect(url.searchParams.get("udm")).toBe("2");
  expect(url.searchParams.get("q")).toBe(place.title);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  open.mockRestore();
});

test.each([390, 1366])("%ipx에서 시트 위 콘텐츠는 모바일에만 표시한다", (width) => {
  resize(width);
  render(
    <MapPlaceDetailPanel
      place={place}
      onClose={vi.fn()}
      mobileAboveContent={<div>담은 코스 1개</div>}
    />
  );
  if (width === 390) {
    expect(screen.getByText("담은 코스 1개").closest(".PlaceDetailPanelAbove")).not.toBeNull();
    expect(screen.getByText("담은 코스 1개").closest(".AppResponsivePanelBody")).toBeNull();
  } else {
    expect(screen.queryByText("담은 코스 1개")).not.toBeInTheDocument();
  }
});

test("모바일에서 50%, 90%를 순환하고 이미지 오류 시 대체 이미지를 표시한다", () => {
  resize(390);
  render(<MapPlaceDetailPanel place={place} onClose={vi.fn()} />);
  const dialog = screen.getByRole("dialog");
  expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
  fireEvent.click(screen.getByRole("button", { name: "패널 높이 조절" }));
  expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("90dvh");
  fireEvent.click(screen.getByRole("button", { name: "패널 높이 조절" }));
  expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
  fireEvent.error(screen.getByRole("img", { name: place.image.alt }));
  expect(screen.getByText("이미지 준비중")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "스탬프/코스 추가" })).toBeDisabled();
});
