import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useKeyboardCharacterDirection } from "./useKeyboardCharacterDirection";

function dispatchKeyboardEvent(type: "keydown" | "keyup", key: string, target?: Element): void {
  const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, key });
  (target ?? window).dispatchEvent(event);
}

describe("useKeyboardCharacterDirection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("combines WASD keys into a normalized direction and stops after release", () => {
    const onDirectionChange = vi.fn();

    renderHook(() => useKeyboardCharacterDirection({ onDirectionChange }));

    act(() => {
      dispatchKeyboardEvent("keydown", "w");
      dispatchKeyboardEvent("keydown", "d");
      // requestAnimationFrame 실행을 위해 틱 진행
      vi.advanceTimersByTime(16);
    });

    const diagonalDirection = onDirectionChange.mock.lastCall?.[0];
    expect(diagonalDirection?.x).toBeCloseTo(Math.SQRT1_2);
    expect(diagonalDirection?.y).toBeCloseTo(-Math.SQRT1_2);

    act(() => {
      dispatchKeyboardEvent("keyup", "w");
      dispatchKeyboardEvent("keyup", "d");
    });

    expect(onDirectionChange).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });

  test("supports arrow keys", () => {
    const onDirectionChange = vi.fn();

    renderHook(() => useKeyboardCharacterDirection({ onDirectionChange }));

    act(() => {
      dispatchKeyboardEvent("keydown", "ArrowLeft");
      vi.advanceTimersByTime(16);
    });

    expect(onDirectionChange).toHaveBeenLastCalledWith({ x: -1, y: 0 });
  });

  test("ignores movement keys typed in an input", () => {
    const onDirectionChange = vi.fn();
    const input = document.createElement("input");
    document.body.append(input);

    renderHook(() => useKeyboardCharacterDirection({ onDirectionChange }));

    act(() => {
      dispatchKeyboardEvent("keydown", "w", input);
      vi.advanceTimersByTime(16);
    });

    expect(onDirectionChange).not.toHaveBeenCalled();
    input.remove();
  });

  test("clears pressed keys when disabled", () => {
    const onDirectionChange = vi.fn();
    const { rerender } = renderHook(
      ({ disabled }) => useKeyboardCharacterDirection({ disabled, onDirectionChange }),
      { initialProps: { disabled: false } }
    );

    act(() => {
      dispatchKeyboardEvent("keydown", "w");
      vi.advanceTimersByTime(16);
    });

    act(() => {
      rerender({ disabled: true });
    });

    expect(onDirectionChange).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });
});
