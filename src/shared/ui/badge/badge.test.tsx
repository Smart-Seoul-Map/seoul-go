import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppBadge } from ".";

describe("AppBadge", () => {
  test("renders readonly status content without button semantics", () => {
    render(<AppBadge ariaLabel="현재 탐방 상태">용산구 탐방중</AppBadge>);

    expect(screen.getByLabelText("현재 탐방 상태")).toHaveTextContent("용산구 탐방중");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("exposes visual variants through data attributes", () => {
    render(
      <AppBadge size="lg" tone="warning" variant="outline">
        탐방 상태
      </AppBadge>
    );

    const badge = screen.getByText("탐방 상태").closest(".AppBadge");

    expect(badge).toHaveAttribute("data-size", "lg");
    expect(badge).toHaveAttribute("data-tone", "warning");
    expect(badge).toHaveAttribute("data-variant", "outline");
  });

  test("renders a decorative leading slot", () => {
    render(<AppBadge leading={<span data-testid="badge-dot" />}>서울 야경명소 0/3</AppBadge>);

    expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
    expect(screen.getByText("서울 야경명소 0/3")).toBeInTheDocument();
  });
});
