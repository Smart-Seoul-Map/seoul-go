import { describe, expect, test } from "vitest";

import { clampCharacterDirection, normalizeCharacterDirection } from "./characterDirection";

describe("normalizeCharacterDirection", () => {
  test("keeps a single-axis direction unchanged", () => {
    expect(normalizeCharacterDirection({ x: 1, y: 0 })).toEqual({ x: 1, y: 0 });
  });

  test("normalizes a diagonal direction to unit length", () => {
    const direction = normalizeCharacterDirection({ x: 1, y: -1 });

    expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1);
    expect(direction.x).toBeCloseTo(Math.SQRT1_2);
    expect(direction.y).toBeCloseTo(-Math.SQRT1_2);
  });

  test("returns the idle direction for a zero vector", () => {
    expect(normalizeCharacterDirection({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe("clampCharacterDirection", () => {
  test("preserves joystick strength below unit length", () => {
    expect(clampCharacterDirection({ x: 0.5, y: 0 })).toEqual({ x: 0.5, y: 0 });
  });

  test("clamps directions that exceed unit length", () => {
    expect(clampCharacterDirection({ x: 2, y: 0 })).toEqual({ x: 1, y: 0 });
  });
});
