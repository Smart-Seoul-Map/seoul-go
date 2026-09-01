import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useCharacterMovementController } from "./useCharacterMovementController";

type Point = {
  x: number;
  y: number;
};

const getDistance = (from: Point, to: Point) => Math.hypot(to.x - from.x, to.y - from.y);
const getHeadingRadians = (from: Point, to: Point) => Math.atan2(to.y - from.y, to.x - from.x);
const interpolate = (from: Point, to: Point, ratio: number): Point => ({
  x: from.x + (to.x - from.x) * ratio,
  y: from.y + (to.y - from.y) * ratio,
});
const advanceByDirection = (position: Point, direction: Point, distance: number): Point => ({
  x: position.x + direction.x * distance,
  y: position.y + direction.y * distance,
});

function createControllerOptions(overrides = {}) {
  return {
    arrivalRadius: 2,
    getDistance,
    getHeadingRadians,
    initialPosition: { x: 0, y: 0 },
    interpolate,
    maxFrameDeltaSeconds: 1,
    onArrive: vi.fn(),
    onFrame: vi.fn(),
    speedPerSecond: 5,
    ...overrides,
  };
}

describe("useCharacterMovementController", () => {
  const frameCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    frameCallbacks.length = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  test("moves toward a clicked target and exposes run state with heading", () => {
    const onFrame = vi.fn();
    const { result } = renderHook(() =>
      useCharacterMovementController(createControllerOptions({ onFrame }))
    );

    act(() => {
      result.current.moveTo({ x: 10, y: 0 });
    });
    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(1000);
    });

    expect(result.current.modelKey).toBe("walk");
    expect(result.current.headingRadians).toBe(0);
    expect(onFrame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        position: { x: 5, y: 0 },
        status: "moving",
        target: { x: 10, y: 0 },
      })
    );
  });

  test("stops near the target and calls onArrive without snapping", () => {
    const onArrive = vi.fn();
    const onFrame = vi.fn();
    const { result } = renderHook(() =>
      useCharacterMovementController(createControllerOptions({ onArrive, onFrame }))
    );

    act(() => {
      result.current.moveTo({ x: 10, y: 0 });
    });
    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(1000);
      frameCallbacks.shift()?.(2000);
    });

    expect(result.current.modelKey).toBe("idlePrimary");
    expect(onArrive).toHaveBeenCalledWith({
      position: { x: 8, y: 0 },
      target: { x: 10, y: 0 },
    });
    expect(onFrame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        position: { x: 8, y: 0 },
        status: "arrived",
      })
    );
  });

  test("moves continuously in a direction until stopped", () => {
    const onFrame = vi.fn();
    const { result } = renderHook(() =>
      useCharacterMovementController(createControllerOptions({ onFrame }))
    );

    act(() => {
      result.current.moveInDirection({
        advancePosition: advanceByDirection,
        direction: { x: 1, y: 0 },
      });
    });
    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(1000);
    });

    expect(result.current.getCurrentPosition()).toEqual({ x: 5, y: 0 });
    expect(result.current.modelKey).toBe("walk");
    expect(onFrame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        movementType: "direction",
        position: { x: 5, y: 0 },
        status: "moving",
      })
    );

    act(() => {
      result.current.stop();
    });

    expect(result.current.getCurrentPosition()).toEqual({ x: 5, y: 0 });
    expect(result.current.modelKey).toBe("idlePrimary");
  });

  test("direction movement replaces a clicked target", () => {
    const onFrame = vi.fn();
    const { result } = renderHook(() =>
      useCharacterMovementController(createControllerOptions({ onFrame }))
    );

    act(() => {
      result.current.moveTo({ x: 10, y: 0 });
      result.current.moveInDirection({
        advancePosition: advanceByDirection,
        direction: { x: 0, y: 1 },
      });
    });
    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(1000);
    });

    expect(result.current.getCurrentPosition()).toEqual({ x: 0, y: 5 });
    expect(onFrame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        movementType: "direction",
        position: { x: 0, y: 5 },
      })
    );
  });

  test("uses direction magnitude as continuous movement strength", () => {
    const { result } = renderHook(() => useCharacterMovementController(createControllerOptions()));

    act(() => {
      result.current.moveInDirection({
        advancePosition: advanceByDirection,
        direction: { x: 0.5, y: 0 },
      });
    });
    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(1000);
    });

    expect(result.current.getCurrentPosition()).toEqual({ x: 2.5, y: 0 });
  });
});
