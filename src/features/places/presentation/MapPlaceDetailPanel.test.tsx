import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { MapPlaceDetailPanel } from "./MapPlaceDetailPanel";

const originalWidth = window.innerWidth;
const place = {
  title: "해방촌 신흥시장",
  selectionYear: 2025,
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
  const search = within(dialog).getByRole("link", { name: `${place.title} 네이버 검색` });
  expect(within(title.closest(".AppResponsivePanelHeader")!).getByText("2025")).toHaveClass(
    "AppBadge-content"
  );
  const url = new URL(search.getAttribute("href")!);
  expect(url.hostname).toBe("search.naver.com");
  expect(url.searchParams.get("query")).toBe(place.title);
  expect(search).toHaveAttribute("target", "_blank");
  expect(search).toHaveAttribute("rel", "noopener noreferrer");
  expect(search.closest(".AppResponsivePanelBody")).toBeNull();
  const add = within(dialog).getByRole("button", { name: "스탬프/코스 추가" });
  expect(add.closest(".AppResponsivePanelFooter")).not.toBeNull();
  expect(add.closest(".AppResponsivePanelBody")).toBeNull();
  fireEvent.click(add);
  expect(onAddToCourse).toHaveBeenCalledOnce();
  fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }));
  expect(onClose).toHaveBeenCalledOnce();
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
