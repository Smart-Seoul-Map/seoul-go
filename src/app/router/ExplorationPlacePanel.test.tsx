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
