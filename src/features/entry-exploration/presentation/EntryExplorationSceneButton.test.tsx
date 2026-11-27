import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntryExplorationSceneButton } from "./EntryExplorationSceneButton";

afterEach(cleanup);

describe("EntryExplorationSceneButton", () => {
  test("renders nothing while hidden", () => {
    render(
      <EntryExplorationSceneButton isVisible={false} onClick={vi.fn()}>
        랜덤으로 뽑기
      </EntryExplorationSceneButton>
    );

    expect(screen.queryByRole("button", { name: "랜덤으로 뽑기" })).toBeNull();
  });

  test("calls onClick and can be disabled afterwards", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <EntryExplorationSceneButton isVisible onClick={onClick}>
        랜덤으로 뽑기
      </EntryExplorationSceneButton>
    );

    fireEvent.click(screen.getByRole("button", { name: "랜덤으로 뽑기" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <EntryExplorationSceneButton isDisabled isVisible onClick={onClick}>
        랜덤으로 뽑기
      </EntryExplorationSceneButton>
    );
    expect(screen.getByRole("button", { name: "랜덤으로 뽑기" })).toBeDisabled();
  });
});
