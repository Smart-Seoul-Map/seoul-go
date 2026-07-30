import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ExplorationPage } from "./ExplorationPage";

const themeProgressItems = [
  {
    id: "all",
    markerColor: null,
    markerColorToken: null,
    name: "방문지",
    totalCount: 3,
    visitedCount: 0,
  },
  {
    id: "night",
    markerColor: "#1971c2",
    markerColorToken: "--sg-place-theme-blue",
    name: "서울 야경명소",
    totalCount: 2,
    visitedCount: 0,
  },
] as const;

describe("ExplorationPage", () => {
  test("지도 위에 테마별 장소 개수 배지를 표시한다", () => {
    render(<ExplorationPage themeProgressItems={themeProgressItems} />);

    expect(screen.getByLabelText("서울 지도 탐색")).toBeInTheDocument();
    expect(screen.getByLabelText("테마별 장소 개수")).toBeInTheDocument();
    expect(screen.getByLabelText("서울 야경명소 장소 0/2")).toBeInTheDocument();
    expect(screen.getByText("방문지")).toBeInTheDocument();
    expect(screen.getByText("서울 야경명소")).toBeInTheDocument();
    expect(screen.getByText("0/3")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("자치구 이름이 있을 때만 현재 탐방 상태 배지를 표시한다", () => {
    const { rerender } = render(<ExplorationPage themeProgressItems={themeProgressItems} />);

    expect(screen.queryByLabelText("현재 용산구 탐방중")).not.toBeInTheDocument();

    rerender(<ExplorationPage districtName="용산구" themeProgressItems={themeProgressItems} />);

    expect(screen.getByLabelText("현재 용산구 탐방중")).toBeInTheDocument();
    expect(screen.getByText("용산구 탐방중")).toBeInTheDocument();
  });
});
