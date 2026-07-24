import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LINE2_INITIAL_STATION_ID } from "../config/line2SelectionConfig";
import { useLine2StationSelection } from "./useLine2StationSelection";

describe("useLine2StationSelection", () => {
  const frameCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    frameCallbacks.length = 0;
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      })
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("moves the train and exposes the randomly selected station", () => {
    const { result } = renderHook(useLine2StationSelection);

    act(() => {
      result.current.handleStationSelection();
    });
    expect(result.current.status).toBe("selecting");

    act(() => {
      frameCallbacks.shift()?.(0);
      frameCallbacks.shift()?.(4200);
    });

    expect(result.current.status).toBe("selected");
    expect(result.current.selectedStation?.id).toBe(LINE2_INITIAL_STATION_ID);
  });

  test("ignores repeated selection while the train is moving", () => {
    const { result } = renderHook(useLine2StationSelection);

    act(() => {
      result.current.handleStationSelection();
      result.current.handleStationSelection();
    });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});
