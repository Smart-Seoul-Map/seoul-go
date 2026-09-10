import { describe, expect, test } from "vitest";
import { getSnapHeight, resolveDragDestination } from "./sheetSnapPoints";

describe("sheet snap points", () => {
  test("resolves pixel and viewport-fraction snap heights", () => {
    expect(getSnapHeight("300px", 800)).toBe(300);
    expect(getSnapHeight(0.5, 800)).toBe(400);
  });
  test("settles near the next snap after an upward drag", () => {
    expect(
      resolveDragDestination({
        heights: [200, 400, 800],
        startHeight: 200,
        deltaY: -180,
        dismissible: true,
      })
    ).toEqual({ index: 1 });
  });
  test("dismisses below the lowest snap and snaps back when non-dismissible", () => {
    const drag = { heights: [200, 400], startHeight: 200, deltaY: 150 };
    expect(resolveDragDestination({ ...drag, dismissible: true })).toEqual({ close: true });
    expect(resolveDragDestination({ ...drag, dismissible: false })).toEqual({ index: 0 });
  });
  test("does not dismiss for a small downward drag", () => {
    expect(
      resolveDragDestination({ heights: [400], startHeight: 400, deltaY: 25, dismissible: true })
    ).toEqual({ index: 0 });
  });
});
