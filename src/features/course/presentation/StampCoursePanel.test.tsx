import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { stampCourseStore } from "../application/useStampCourseStore";
import { createStampCourseStore } from "../application/stampCourseStore";
import { StampCoursePanel } from "./StampCoursePanel";

const originalWidth = window.innerWidth;

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  stampCourseStore.getState().clearPlaces();
});

afterEach(() => {
  cleanup();
  stampCourseStore.getState().clearPlaces();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
});

function savePlaces(count: number): void {
  for (let index = 0; index < count; index += 1) {
    stampCourseStore.getState().addPlace({
      id: `place-${index}`,
      name: `저장된 장소 ${index + 1}`,
      themeId: "theme",
      position: { lat: 37.5, lng: 127 },
    });
  }
}

test.each([0, 1, 2, 3, 6])("저장된 코스 %i개에 맞는 높이로 열고 항상 6칸을 표시한다", (count) => {
  savePlaces(count);
  render(<StampCoursePanel onClose={vi.fn()} />);
  expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe(
    count <= 2 ? "50dvh" : "90dvh"
  );
  expect(screen.getByLabelText("담긴 코스 개수")).toHaveTextContent(`${count}/6`);
  expect(
    within(screen.getByRole("list", { name: "스탬프 코스" })).getAllByRole("listitem")
  ).toHaveLength(6);
  for (let index = 0; index < count; index += 1) {
    expect(screen.getByText(`저장된 장소 ${index + 1}`)).toBeInTheDocument();
  }
});

test("복원한 코스로 시작하고 사용자가 높이를 바꾼 후에도 저장 개수 변경으로 튀지 않는다", () => {
  savePlaces(3);
  stampCourseStore.setState({ places: createStampCourseStore().getState().places });
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "패널 높이 조절" }));
  expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
  act(() => {
    stampCourseStore.getState().removePlace("place-0");
  });
  expect(screen.getByLabelText("담긴 코스 개수")).toHaveTextContent("2/6");
  expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
});

test("닫기는 저장 내용을 유지하고 푸터 동작은 아직 비활성 상태다", () => {
  savePlaces(1);
  const onClose = vi.fn();
  render(<StampCoursePanel onClose={onClose} />);
  for (const name of [
    "카카오 도보길찾기",
    "네이버 도보길찾기",
    "코스 이미지 저장",
    "코스 링크 공유",
  ]) {
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
  }
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(stampCourseStore.getState().places).toHaveLength(1);
});

test("빈 코스는 안내 문구 없이 푸터 전체를 비활성화하고 저장 개수 변경을 반영한다", () => {
  render(<StampCoursePanel onClose={vi.fn()} />);
  const footerButtons = () => document.querySelectorAll(".StampCourseFooter button");
  for (const button of footerButtons()) expect(button).toBeDisabled();
  expect(screen.queryByText("아직 담은 코스가 없어요.")).not.toBeInTheDocument();
  act(() => savePlaces(1));
  for (const button of footerButtons()) {
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  }
  act(() => stampCourseStore.getState().clearPlaces());
  for (const button of footerButtons()) expect(button).toBeDisabled();
});
