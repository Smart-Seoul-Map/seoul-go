import { describe, expect, test } from "vitest";

import { getEntryExplorationDartFlightFrame } from "./entryExplorationDartAim";

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
