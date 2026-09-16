import "@testing-library/jest-dom/vitest";
import { type ReactElement } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render as renderUi,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AppToastProvider } from "@shared/ui/toast";

import { stampCourseStore } from "../application/useStampCourseStore";
import { createStampCourseStore } from "../application/stampCourseStore";
import { StampCoursePanel } from "./StampCoursePanel";

const originalWidth = window.innerWidth;

function render(ui: ReactElement) {
  return renderUi(ui, { wrapper: AppToastProvider });
}

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  stampCourseStore.getState().clearPlaces();
});

afterEach(() => {
  cleanup();
  stampCourseStore.getState().clearPlaces();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

test("닫기는 저장 내용을 유지하고 미연결 푸터 동작은 아직 비활성 상태다", () => {
  savePlaces(1);
  const onClose = vi.fn();
  render(<StampCoursePanel onClose={onClose} />);
  for (const name of ["네이버 도보길찾기", "이미지 저장", "링크 공유"]) {
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
  }
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(stampCourseStore.getState().places).toHaveLength(1);
});

test("빈 코스는 안내 문구 없이 미연결 푸터를 비활성화하고 저장 개수 변경을 반영한다", () => {
  render(<StampCoursePanel onClose={vi.fn()} />);
  const footerButtons = () =>
    document.querySelectorAll('.StampCourseFooter button:not([data-action="kakao"])');
  for (const button of footerButtons()) expect(button).toBeDisabled();
  expect(screen.getByRole("button", { name: "편집" })).toBeDisabled();
  expect(screen.queryByText("아직 담은 코스가 없어요.")).not.toBeInTheDocument();
  act(() => savePlaces(1));
  for (const button of footerButtons()) {
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  }
  act(() => stampCourseStore.getState().clearPlaces());
  for (const button of footerButtons()) expect(button).toBeDisabled();
});

test("편집에서 개별 삭제를 즉시 저장하고 실행 취소로 원래 위치에 복구한다", () => {
  savePlaces(3);
  render(<StampCoursePanel onClose={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "저장된 장소 2 삭제" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  expect(screen.getByRole("button", { name: "전체 삭제" })).toBeEnabled();
  expect(screen.getAllByRole("button", { name: /저장된 장소 \d 삭제/ })).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 2 삭제" }));
  expect(screen.getByLabelText("담긴 코스 개수")).toHaveTextContent("2/6");
  expect(screen.getByRole("button", { name: "저장된 장소 3 순서 변경" })).toHaveFocus();
  expect(
    createStampCourseStore()
      .getState()
      .places.map((place) => place.id)
  ).toEqual(["place-0", "place-2"]);
  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
  expect(
    createStampCourseStore()
      .getState()
      .places.map((place) => place.id)
  ).toEqual(["place-0", "place-1", "place-2"]);
});

test("편집 중 푸터를 비활성화하고 완료하면 저장한 내용을 유지하며 일반 모드로 돌아온다", () => {
  savePlaces(3);
  const onClose = vi.fn();
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  render(<StampCoursePanel onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  for (const button of document.querySelectorAll(".StampCourseFooter button")) {
    expect(button).toBeDisabled();
    fireEvent.click(button);
  }
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 1 삭제" }));
  fireEvent.click(screen.getByRole("button", { name: "완료" }));
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "편집" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: /순서 변경/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "카카오 도보길찾기" })).toBeEnabled();
  expect(
    createStampCourseStore()
      .getState()
      .places.map((place) => place.id)
  ).toEqual(["place-1", "place-2"]);
});

test("모든 장소를 개별 삭제한 뒤에도 완료로 편집을 종료할 수 있다", () => {
  savePlaces(1);
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 1 삭제" }));
  expect(screen.getByRole("button", { name: "완료" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "완료" }));
  expect(screen.getByRole("button", { name: "편집" })).toBeDisabled();
});

test("저장된 장소 이미지는 복원 후 일반 모드와 편집 모드에서 표시된다", () => {
  savePlaces(1);
  const places = stampCourseStore.getState().places.map((place) => ({
    ...place,
    imageUrl: "https://example.com/place.jpg",
  }));
  localStorage.setItem("seoul-go:stamp-course:v1", JSON.stringify({ version: 1, places }));
  stampCourseStore.setState({ places: createStampCourseStore().getState().places });
  render(<StampCoursePanel onClose={vi.fn()} />);
  const image = () => document.querySelector(".StampCourseSealImage");
  expect(image()).toHaveAttribute("src", "https://example.com/place.jpg");
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  expect(image()).toHaveAttribute("src", "https://example.com/place.jpg");
  fireEvent.error(image()!);
  expect(image()).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "저장된 장소 1 순서 변경" })).toHaveTextContent("GO");
});

test("연속 삭제의 실행 취소는 마지막 삭제만 복구한다", () => {
  savePlaces(3);
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 1 삭제" }));
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 2 삭제" }));
  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
  expect(stampCourseStore.getState().places.map((place) => place.id)).toEqual([
    "place-1",
    "place-2",
  ]);
});

test("전체 삭제는 코스 저장만 비우고 닫으며 이전 실행 취소를 남기지 않는다", () => {
  savePlaces(3);
  const onClose = vi.fn();
  localStorage.setItem("unrelated-visit-record", "preserved");
  render(<StampCoursePanel onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 1 삭제" }));
  fireEvent.click(screen.getByRole("button", { name: "전체 삭제" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(stampCourseStore.getState().places).toEqual([]);
  expect(localStorage.getItem("seoul-go:stamp-course:v1")).toBeNull();
  expect(localStorage.getItem("unrelated-visit-record")).toBe("preserved");
  expect(screen.getByText("코스를 모두 삭제했어요")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "실행 취소" })).not.toBeInTheDocument();
  localStorage.removeItem("unrelated-visit-record");
});

test("키보드로 순서를 즉시 저장하고 닫았다 다시 열면 일반 모드로 돌아온다", () => {
  savePlaces(3);
  const onClose = vi.fn();
  const { rerender } = render(<StampCoursePanel onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  const handle = screen.getByRole("button", { name: "저장된 장소 1 순서 변경" });
  handle.focus();
  fireEvent.keyDown(handle, { key: "ArrowDown" });
  expect(
    createStampCourseStore()
      .getState()
      .places.map((place) => place.id)
  ).toEqual(["place-1", "place-0", "place-2"]);
  expect(handle).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  expect(onClose).toHaveBeenCalledOnce();
  rerender(<StampCoursePanel open={false} onClose={onClose} />);
  rerender(<StampCoursePanel open onClose={onClose} />);
  expect(screen.getByRole("button", { name: "편집" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: /순서 변경/ })).not.toBeInTheDocument();
});

test("마지막 장소 개별 삭제 후에도 실행 취소가 가능하고 높이는 유지한다", () => {
  savePlaces(1);
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 1 삭제" }));
  expect(screen.getByRole("button", { name: "전체 삭제" })).toBeDisabled();
  expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
  for (const button of document.querySelectorAll(
    '.StampCourseFooter button:not([data-action="kakao"])'
  ))
    expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
  expect(screen.getByRole("button", { name: "저장된 장소 1 삭제" })).toBeInTheDocument();
});

test("실행 취소 전에 코스가 가득 차면 기존 제한을 유지하고 복구 불가 알림을 표시한다", () => {
  savePlaces(6);
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  fireEvent.click(screen.getByRole("button", { name: "저장된 장소 1 삭제" }));
  act(() =>
    stampCourseStore.getState().addPlace({
      id: "new-place",
      name: "새 장소",
      themeId: "theme",
      position: { lat: 37.5, lng: 127 },
    })
  );
  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));
  expect(stampCourseStore.getState().places).toHaveLength(6);
  expect(stampCourseStore.getState().places.some((place) => place.id === "place-0")).toBe(false);
  expect(
    screen.getByText("이미 담긴 장소이거나 코스가 가득 차 복구할 수 없어요")
  ).toBeInTheDocument();
});

test.each([0, 1])("코스가 %i개면 카카오 이동 대신 최소 개수 안내를 표시한다", (count) => {
  savePlaces(count);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "카카오 도보길찾기" }));
  expect(screen.getByText("도보길찾기는 장소를 2개 이상 담아주세요")).toBeInTheDocument();
  expect(open).not.toHaveBeenCalled();
});

test("카카오 길찾기는 변경된 코스 순서대로 새 탭에서 연다", () => {
  savePlaces(3);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  render(<StampCoursePanel onClose={vi.fn()} />);
  act(() => stampCourseStore.getState().reorderPlaces({ fromIndex: 0, toIndex: 2 }));
  const button = screen.getByRole("button", { name: "카카오 도보길찾기" });
  expect(button).not.toHaveAttribute("aria-disabled", "true");
  fireEvent.click(button);
  const points = [2, 3, 1].map(
    (number) => `${encodeURIComponent(`저장된 장소 ${number}`)},37.5,127`
  );
  expect(open).toHaveBeenCalledWith(
    `https://map.kakao.com/link/by/walk/${points.join("/")}`,
    "_blank",
    "noopener,noreferrer"
  );
});

function prepareDrag() {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1)
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  savePlaces(2);
  render(<StampCoursePanel onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "편집" }));
  const body = screen.getByLabelText("담긴 장소 목록");
  vi.spyOn(body, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 300, 400));
  const slots = within(screen.getByRole("list", { name: "스탬프 코스" })).getAllByRole("listitem");
  vi.spyOn(slots[0], "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 150, 150));
  vi.spyOn(slots[1], "getBoundingClientRect").mockReturnValue(new DOMRect(150, 0, 150, 150));
  const handle = screen.getByRole("button", { name: "저장된 장소 1 순서 변경" });
  fireEvent.pointerDown(handle, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 50,
    clientY: 50,
  });
  return handle;
}

test("드래그 중에는 저장하지 않고 다른 스탬프에 놓았을 때 순서를 저장한다", () => {
  const handle = prepareDrag();
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 200, clientY: 50 });
  expect(stampCourseStore.getState().places[0].id).toBe("place-0");
  expect(screen.getByLabelText("2번 저장된 장소 2")).toHaveAttribute("data-drop-target", "true");
  fireEvent.pointerUp(handle, { pointerId: 1, clientX: 200, clientY: 50 });
  expect(
    createStampCourseStore()
      .getState()
      .places.map((place) => place.id)
  ).toEqual(["place-1", "place-0"]);
  expect(handle.style.translate).toBe("");
});

test.each(["outside", "cancel", "empty", "tap"])(
  "드래그 취소나 유효하지 않은 대상에는 저장하지 않는다: %s",
  (kind) => {
    const handle = prepareDrag();
    const x = kind === "outside" ? 400 : 200;
    const y = kind === "empty" ? 300 : 50;
    if (kind !== "tap") fireEvent.pointerMove(handle, { pointerId: 1, clientX: x, clientY: y });
    if (kind === "cancel") fireEvent.pointerCancel(handle, { pointerId: 1 });
    else fireEvent.pointerUp(handle, { pointerId: 1, clientX: x, clientY: y });
    expect(
      createStampCourseStore()
        .getState()
        .places.map((place) => place.id)
    ).toEqual(["place-0", "place-1"]);
    expect(handle.style.translate).toBe("");
  }
);
