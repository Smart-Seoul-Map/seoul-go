import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ExplorationPage } from "./ExplorationPage";

describe("서울고 React 앱", () => {
  test("지도 탐색 시작 화면을 렌더링한다", () => {
    render(<ExplorationPage />);

    expect(screen.getByRole("heading", { name: "서울고" })).toBeInTheDocument();
    expect(screen.getAllByText("500m")).toHaveLength(2);
    expect(screen.getByText("서울 미래유산")).toBeInTheDocument();
    expect(screen.getByLabelText("서울 지도")).toBeInTheDocument();
  });
});
