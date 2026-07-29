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
  test("지도 위에 실제 장소 개수 기반 테마 현황 칩만 표시한다", () => {
    render(<ExplorationPage themeProgressItems={themeProgressItems} />);

    expect(screen.getByLabelText("서울 지도 탐색")).toBeInTheDocument();
    expect(screen.getByLabelText("장소 테마 현황")).toBeInTheDocument();
    expect(screen.getByText("방문지")).toBeInTheDocument();
    expect(screen.getByText("서울 야경명소")).toBeInTheDocument();
    expect(screen.getByText("0/3")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
