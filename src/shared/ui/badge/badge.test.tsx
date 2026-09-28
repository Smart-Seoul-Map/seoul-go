import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppBadge } from ".";

describe("AppBadge", () => {
  test("keeps numeric labels complete without introducing interactive semantics", () => {
    render(
      <AppBadge size="number-lg" tone="brand" variant="outline" textPolicy="singleLine">
        2026
      </AppBadge>
    );
    const badge = screen.getByText("2026").closest(".AppBadge");
    expect(badge).toHaveAttribute("data-text-policy", "singleLine");
    expect(badge).toHaveAttribute("data-size", "number-lg");
    expect(badge?.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("tabindex");
  });

  test("supports two-line place labels filling their layout container", () => {
    render(
      <AppBadge size="xs" variant="outline" width="fill" textPolicy="twoLines">
        서대문형무소 역사관
      </AppBadge>
    );
    const badge = screen.getByText("서대문형무소 역사관").closest(".AppBadge");
    expect(badge).toHaveAttribute("data-text-policy", "twoLines");
    expect(badge).toHaveAttribute("data-width", "fill");
  });

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
