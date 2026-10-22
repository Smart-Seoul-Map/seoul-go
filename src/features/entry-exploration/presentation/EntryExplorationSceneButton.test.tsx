import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EntryExplorationSceneButton } from "./EntryExplorationSceneButton";

afterEach(cleanup);

describe("EntryExplorationSceneButton", () => {
  test("renders nothing while hidden", () => {
    render(
      <EntryExplorationSceneButton isVisible={false} onClick={vi.fn()} placement="bottom">
        START
      </EntryExplorationSceneButton>
    );

    expect(screen.queryByRole("button", { name: "START" })).toBeNull();
  });

  test("calls onClick and can be disabled afterwards", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <EntryExplorationSceneButton isVisible onClick={onClick} placement="bottom">
        START
      </EntryExplorationSceneButton>
    );

    fireEvent.click(screen.getByRole("button", { name: "START" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <EntryExplorationSceneButton isDisabled isVisible onClick={onClick} placement="bottom">
        START
      </EntryExplorationSceneButton>
    );
    expect((screen.getByRole("button", { name: "START" }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});
