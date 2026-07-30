import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ExplorationDistrictStatusBadge } from "./ExplorationDistrictStatusBadge";

describe("ExplorationDistrictStatusBadge", () => {
  test("현재 탐방 중인 자치구를 읽기 전용 배지로 표시한다", () => {
    render(<ExplorationDistrictStatusBadge districtName="용산구" />);

    expect(screen.getByLabelText("현재 용산구 탐방중")).toBeInTheDocument();
    expect(screen.getByText("용산구 탐방중")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
