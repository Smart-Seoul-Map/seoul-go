import { describe, expect, test } from "vitest";

import {
  createEntrySlotSpin,
  getEntrySlotSpinFrame,
  getSlotDigitAngle,
  pickSlotDigits,
} from "./entrySlotSpin";

describe("entry slot spin", () => {
  test.each([
    [0, 90],
    [1, 126],
    [2, 162],
    [3, 198],
    [4, 234],
    [5, 270],
    [6, 306],
    [7, 342],
    [8, 18],
    [9, 54],
  ])("aligns digit %i with the center of the model window at %i degrees", (digit, degrees) =>
    expect(getSlotDigitAngle(digit)).toBeCloseTo((degrees * Math.PI) / 180)
  );

  test.each([-1, 10, 1.5, NaN])("rejects unsupported digit %s", (digit) => {
    expect(() => getSlotDigitAngle(digit)).toThrow(RangeError);
  });

  test("draws two independent digits including zero and nine", () => {
    const values = [0, 0.99999];
    expect(pickSlotDigits(() => values.shift() ?? 0)).toEqual([0, 9]);
  });

  test("rotates all three reels, stops left first, and reports left/right digits only", () => {
    const spin = createEntrySlotSpin({ digits: [0, 9], from: [0, 0, 0], startedAt: 100 });
    expect(getEntrySlotSpinFrame(spin, 100).angles).toEqual([0, 0, 0]);
    const moving = getEntrySlotSpinFrame(spin, 600);
    expect(moving.angles.every((angle) => angle > 0)).toBe(true);
    expect(moving.result).toBeNull();
    const leftStopped = getEntrySlotSpinFrame(spin, 2300);
    expect(leftStopped.angles[0] % (Math.PI * 2)).toBeCloseTo(Math.PI / 2);
    expect(leftStopped.done).toBe(false);
    const stopped = getEntrySlotSpinFrame(spin, 3100);
    expect(stopped.done).toBe(true);
    expect(stopped.result).toBe("09");
    expect(stopped.angles[2] % (Math.PI * 2)).toBeCloseTo((54 * Math.PI) / 180);
    expect(getEntrySlotSpinFrame(spin, 99999)).toEqual(stopped);
  });

  test("retries forward from current angles without reversing or losing leading zero", () => {
    const from: [number, number, number] = [42, 52, 62];
    const spin = createEntrySlotSpin({ digits: [0, 0], from, startedAt: 0 });
    const frame = getEntrySlotSpinFrame(spin, 3000);
    expect(frame.angles.every((angle, index) => angle > from[index])).toBe(true);
    expect(frame.result).toBe("00");
  });
});
