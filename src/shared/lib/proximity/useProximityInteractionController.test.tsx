import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import type { ProximityInteractionZone } from "./proximityInteraction";
import { useProximityInteractionController } from "./useProximityInteractionController";

type Point = {
  x: number;
  y: number;
};

type InteractionId = "first" | "second";

const ZONES: readonly ProximityInteractionZone<Point, InteractionId>[] = [
  {
    center: { x: 2, y: 2 },
    id: "first-zone",
    interactionId: "first",
    radius: 1,
  },
  {
    center: { x: 6, y: 2 },
    id: "second-zone",
    interactionId: "second",
    radius: 1,
  },
];

const getDistance = (from: Point, to: Point) => Math.hypot(to.x - from.x, to.y - from.y);

function useTestController() {
  return useProximityInteractionController({
    getDistance,
    zones: ZONES,
  });
}

describe("useProximityInteractionController", () => {
  test("activates the zone entered by the current position", () => {
    const { result } = renderHook(useTestController);

    act(() => {
      result.current.detectInteractionAtPoint({ x: 2, y: 2 });
    });

    expect(result.current.activeInteraction).toEqual({
      interactionId: "first",
      zoneId: "first-zone",
    });
    expect(result.current.getHasActiveInteraction()).toBe(true);
  });

  test("rearms a zone only after leaving its radius", () => {
    const { result } = renderHook(useTestController);

    act(() => {
      result.current.detectInteractionAtPoint({ x: 2, y: 2 });
      result.current.closeInteraction();
      result.current.detectInteractionAtPoint({ x: 2, y: 2 });
    });
    expect(result.current.activeInteraction).toBeNull();

    act(() => {
      result.current.detectInteractionAtPoint({ x: 4, y: 2 });
      result.current.detectInteractionAtPoint({ x: 2, y: 2 });
    });
    expect(result.current.activeInteraction?.zoneId).toBe("first-zone");
  });

  test("tracks suppression independently for multiple zones", () => {
    const { result } = renderHook(useTestController);

    act(() => {
      result.current.detectInteractionAtPoint({ x: 2, y: 2 });
      result.current.closeInteraction();
      result.current.detectInteractionAtPoint({ x: 6, y: 2 });
    });

    expect(result.current.activeInteraction).toEqual({
      interactionId: "second",
      zoneId: "second-zone",
    });
  });
});
