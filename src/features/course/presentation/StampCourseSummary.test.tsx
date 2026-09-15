import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";

import { stampCourseStore } from "../application/useStampCourseStore";
import { createStampCourseStore } from "../application/stampCourseStore";
import { StampCourseSummary } from "./StampCourseSummary";

const place = {
  id: "market",
  name: "해방촌 신흥시장",
  position: { lat: 37.54, lng: 126.98 },
  themeId: "100032",
};

beforeEach(() => stampCourseStore.getState().clearPlaces());
afterEach(() => {
  cleanup();
  stampCourseStore.getState().clearPlaces();
});

test("코스 추가와 삭제를 반영하고 중복 추가는 개수를 늘리지 않는다", () => {
  render(<StampCourseSummary />);
  expect(screen.getByRole("status")).toHaveTextContent("담은 코스 0개");
  act(() => {
    stampCourseStore.getState().addPlace(place);
  });
  expect(screen.getByRole("status")).toHaveTextContent("담은 코스 1개");
  act(() => {
    stampCourseStore.getState().addPlace(place);
  });
  expect(screen.getByRole("status")).toHaveTextContent("담은 코스 1개");
  act(() => {
    stampCourseStore.getState().removePlace(place.id);
  });
  expect(screen.getByRole("status")).toHaveTextContent("담은 코스 0개");
  expect(screen.getByRole("button", { name: "코스 보기" })).toHaveAttribute(
    "aria-disabled",
    "true"
  );
});

test("저장소에서 복원한 코스 개수를 표시한다", () => {
  stampCourseStore.getState().addPlace(place);
  const restoredStore = createStampCourseStore();
  stampCourseStore.setState({ places: restoredStore.getState().places });
  render(<StampCourseSummary />);
  expect(screen.getByRole("status")).toHaveTextContent("담은 코스 1개");
});
