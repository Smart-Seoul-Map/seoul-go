import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";

import { MAX_STAMP_COURSE_PLACES, stampCourseStore } from "@features/course";
import type { ExplorationPlaceMarkerSelection } from "@features/exploration";
import { ExplorationPlacePanel } from "./ExplorationPlacePanel";
import { useAddExplorationPlaceToCourse } from "./useAddExplorationPlaceToCourse";

const place: ExplorationPlaceMarkerSelection = {
  id: "market",
  name: "해방촌 신흥시장",
  description: "시장 골목의 공방과 가게를 만나는 장소",
  imageUrl: "",
  markerColor: "#08b2f0",
  themeId: "100032",
  themeName: "서울 미래유산",
  position: { lat: 37.54, lng: 126.98 },
};

function Panel() {
  const onAddToCourse = useAddExplorationPlaceToCourse();
  return <ExplorationPlacePanel place={place} onAddToCourse={onAddToCourse} onClose={() => {}} />;
}

test.each(["100032", "100575", "1786321258890"])(
  "테마 %s의 장소 설명을 그대로 표시한다",
  (themeId) => {
    render(<ExplorationPlacePanel place={{ ...place, themeId }} onClose={() => {}} />);
    expect(screen.getByText("시장 골목의 공방과 가게를 만나는 장소")).toBeInTheDocument();
  }
);

test("설명이 비어 있으면 임시 공통 문구를 표시하지 않는다", () => {
  render(<ExplorationPlacePanel place={{ ...place, description: "" }} onClose={() => {}} />);
  expect(document.querySelector(".PlaceDetailCardDescription")?.textContent).toBe("");
});

beforeEach(() => stampCourseStore.getState().clearPlaces());
afterEach(() => {
  cleanup();
  stampCourseStore.getState().clearPlaces();
});

test("기존 코스 추가가 성공하면 획득 완료로 바뀌고 다시 열어도 유지된다", () => {
  const view = render(<Panel />);
  expect(screen.getByText("아직 획득 전")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "스탬프/코스 추가" }));
  expect(stampCourseStore.getState().places.map((item) => item.id)).toEqual([place.id]);
  expect(screen.getByText("획득 완료")).toBeInTheDocument();
  expect(screen.queryByText("아직 획득 전")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "스탬프/코스 완료" })).toHaveAttribute(
    "data-acquired",
    "true"
  );
  view.unmount();
  render(<Panel />);
  expect(screen.getByText("획득 완료")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "스탬프/코스 완료" }));
  expect(stampCourseStore.getState().places).toHaveLength(1);
  expect(screen.getByText("획득 완료")).toBeInTheDocument();
});

test("저장된 장소는 획득 완료로 표시하고 코스에서 삭제하면 미획득으로 바뀐다", () => {
  stampCourseStore.getState().addPlace(place);
  render(<Panel />);
  expect(screen.getByText("획득 완료")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "스탬프/코스 완료" })).toBeInTheDocument();
  act(() => {
    stampCourseStore.getState().removePlace(place.id);
  });
  expect(screen.getByText("아직 획득 전")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "스탬프/코스 추가" })).toHaveAttribute(
    "data-acquired",
    "false"
  );
});

test("코스가 가득 차서 추가에 실패하면 아직 획득 전을 유지한다", () => {
  for (let index = 0; index < MAX_STAMP_COURSE_PLACES; index += 1) {
    stampCourseStore.getState().addPlace({ ...place, id: `saved-${index}` });
  }
  render(<Panel />);
  fireEvent.click(screen.getByRole("button", { name: "스탬프/코스 추가" }));
  expect(screen.getByText("아직 획득 전")).toBeInTheDocument();
  expect(screen.queryByText("획득 완료")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "스탬프/코스 추가" })).toHaveAttribute(
    "data-acquired",
    "false"
  );
  expect(stampCourseStore.getState().places).toHaveLength(MAX_STAMP_COURSE_PLACES);
});

test("서울에디션25 패널은 API 설명과 선정연도를 표시한다", () => {
  render(
    <ExplorationPlacePanel
      place={{
        ...place,
        themeId: "1786321258890",
        themeName: "서울에디션25",
        description: "API에서 받은 장소별 설명",
        selectionYear: 2026,
      }}
      onClose={() => {}}
    />
  );

  expect(screen.getByText("API에서 받은 장소별 설명")).toBeInTheDocument();
  expect(screen.getByText("2026")).toBeInTheDocument();
  expect(screen.getByText("방문 완료")).toBeInTheDocument();
  expect(screen.getByText("아직 획득 전")).toBeInTheDocument();
});
