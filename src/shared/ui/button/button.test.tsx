import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { AppButton, AppIconButton, AppTextButton } from ".";

describe("Button wrappers", () => {
  test("renders action buttons as non-submit buttons by default", () => {
    const handleClick = vi.fn();

    render(
      <AppButton onClick={handleClick} size="lg" variant="primary">
        confirm
      </AppButton>
    );

    const button = screen.getByRole("button", { name: "confirm" });

    fireEvent.click(button);

    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("data-size")).toBe("lg");
    expect(button.getAttribute("data-variant")).toBe("primary");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("keeps explicit button types when a form action needs them", () => {
    render(
      <AppButton type="submit" variant="secondary">
        submit
      </AppButton>
    );

    expect(screen.getByRole("button", { name: "submit" }).getAttribute("type")).toBe("submit");
  });

  test("renders text buttons with a quieter visual contract", () => {
    render(
      <AppTextButton size="sm" variant="brand">
        retry
      </AppTextButton>
    );

    const button = screen.getByRole("button", { name: "retry" });

    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("data-size")).toBe("sm");
    expect(button.getAttribute("data-variant")).toBe("brand");
  });

  test("renders icon buttons with an accessible name", () => {
    render(
      <AppIconButton ariaLabel="go back" variant="layer">
        <span aria-hidden="true">icon</span>
      </AppIconButton>
    );

    const button = screen.getByRole("button", { name: "go back" });

    expect(button.getAttribute("aria-label")).toBe("go back");
    expect(button.getAttribute("data-size")).toBe("nav");
    expect(button.getAttribute("data-variant")).toBe("layer");
  });
});
