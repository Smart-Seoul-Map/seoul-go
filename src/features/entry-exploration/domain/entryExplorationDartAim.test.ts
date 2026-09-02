import { describe, expect, test } from "vitest";

import {
  getEntryExplorationDartAimRotation,
  getEntryExplorationDartFlightFrame,
  getEntryExplorationDartSmoothedRotation,
} from "./entryExplorationDartAim";

describe("entry exploration dart aim", () => {
  const aim = {
    aimSpanDegrees: 42,
    from: { x: 200, y: 1100 },
    rangeDegrees: 18,
    restRotationDegrees: -9,
  };

  test("tracks the pointer in both directions instead of saturating", () => {
    const topLeft = getEntryExplorationDartAimRotation({ ...aim, pointer: { x: 0, y: 0 } });
    const middle = getEntryExplorationDartAimRotation({ ...aim, pointer: { x: 960, y: 540 } });
    const bottomRight = getEntryExplorationDartAimRotation({
      ...aim,
      pointer: { x: 1900, y: 1060 },
    });

    expect(topLeft).toBeLessThan(middle);
    expect(middle).toBeLessThan(bottomRight);
  });

  test("keeps the rotation inside the configured range", () => {
    const far = getEntryExplorationDartAimRotation({ ...aim, pointer: { x: 1900, y: -4000 } });

    expect(Math.abs(far - aim.restRotationDegrees)).toBeLessThanOrEqual(aim.rangeDegrees);
  });
});

describe("entry exploration dart flight", () => {
  const flight = { arcHeightRatio: 0.32, from: { x: 0, y: 400 }, to: { x: 600, y: 100 } };

  test("lands exactly on the target point", () => {
    const frame = getEntryExplorationDartFlightFrame({ ...flight, progress: 1 });

    expect(frame.x).toBeCloseTo(flight.to.x);
    expect(frame.y).toBeCloseTo(flight.to.y);
  });

  test("arcs above the straight line midway through", () => {
    const frame = getEntryExplorationDartFlightFrame({ ...flight, progress: 0.5 });

    expect(frame.y).toBeLessThan((flight.from.y + flight.to.y) / 2);
  });
});

describe("entry exploration dart smoothing", () => {
  test("is frame rate independent", () => {
    const oneBigStep = getEntryExplorationDartSmoothedRotation({
      current: 0,
      deltaMs: 32,
      target: 100,
      timeConstantMs: 110,
    });
    const firstHalf = getEntryExplorationDartSmoothedRotation({
      current: 0,
      deltaMs: 16,
      target: 100,
      timeConstantMs: 110,
    });
    const twoSmallSteps = getEntryExplorationDartSmoothedRotation({
      current: firstHalf,
      deltaMs: 16,
      target: 100,
      timeConstantMs: 110,
    });

    expect(twoSmallSteps).toBeCloseTo(oneBigStep, 6);
  });
});
