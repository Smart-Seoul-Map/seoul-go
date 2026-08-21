import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { AppVirtualJoystick } from "./AppVirtualJoystick";

const JOYSTICK_RECT: DOMRect = {
  bottom: 100,
  height: 100,
  left: 0,
  right: 100,
  toJSON: () => ({}),
  top: 0,
  width: 100,
  x: 0,
  y: 0,
};

afterEach(cleanup);

describe("AppVirtualJoystick", () => {
  test("reports drag direction and returns to idle after release", () => {
    const onDirectionChange = vi.fn();

    const { getByRole } = render(
      <AppVirtualJoystick ariaLabel="캐릭터 이동" onDirectionChange={onDirectionChange} />
    );

    const joystick = getByRole("button", { name: "캐릭터 이동" });
    vi.spyOn(joystick, "getBoundingClientRect").mockReturnValue(JOYSTICK_RECT);

    fireEvent.pointerDown(joystick, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(joystick, { clientX: 100, clientY: 50, pointerId: 1 });

    expect(onDirectionChange).toHaveBeenLastCalledWith({ x: 1, y: 0 });

    fireEvent.pointerUp(joystick, { pointerId: 1 });

    expect(onDirectionChange).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });

  test("does not report movement while disabled", () => {
    const onDirectionChange = vi.fn();

    const { getByRole } = render(
      <AppVirtualJoystick ariaLabel="캐릭터 이동" disabled onDirectionChange={onDirectionChange} />
    );

    fireEvent.pointerDown(getByRole("button", { name: "캐릭터 이동" }), {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
    });

    expect(onDirectionChange).not.toHaveBeenCalled();
  });
});
