import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ExplorationThemePlaceCountBadge } from "./ExplorationThemePlaceCountBadge";

describe("ExplorationThemePlaceCountBadge", () => {
  test("테마명과 방문 장소 개수를 읽기 전용 배지로 표시한다", () => {
    render(
      <ExplorationThemePlaceCountBadge
        markerColor="#1971c2"
        markerColorToken="--sg-place-theme-blue"
        name="서울 야경명소"
        totalCount={2}
        visitedCount={0}
      />
    );

    expect(screen.getByLabelText("서울 야경명소 장소 0/2")).toBeInTheDocument();
    expect(screen.getByText("서울 야경명소")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
