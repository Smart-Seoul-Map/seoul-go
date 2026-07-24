import { describe, expect, test } from "vitest";

import { easeInOutCubic, easeOutCubic } from "./easing";

describe("easing", () => {
  test("eases out cubic movement from start to end", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(easeOutCubic(1)).toBe(1);
  });

  test("eases in and out around the midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375);
    expect(easeInOutCubic(1)).toBe(1);
  });

  test("clamps progress into the animation range", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });
});
