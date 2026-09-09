import { describe, expect, test, vi } from "vitest";

import { createEntryExplorationPlaceVisit } from "./entryExplorationPlaceVisit";

const destination = { x: 10, z: 20 };
const outside = { x: 10, z: 23 };

describe("entry place visit", () => {
  test("opens once on entry and does not emit changes every frame", () => {
    const onOpenChange = vi.fn();
    const visit = createEntryExplorationPlaceVisit({ radius: 1, onOpenChange });
    expect(visit.update(outside, destination)).toBe(false);
    expect(visit.update({ x: 10, z: 21 }, destination)).toBe(true);
    expect(visit.update(destination, destination)).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[true]]);
  });

  test.each(["close button", "movement"])("stays closed after %s until exit and reentry", () => {
    const onOpenChange = vi.fn();
    const visit = createEntryExplorationPlaceVisit({ radius: 1, onOpenChange });
    visit.update(destination, destination);
    visit.dismiss();
    visit.dismiss();
    expect(visit.update(destination, destination)).toBe(false);
    visit.update(outside, destination);
    expect(visit.update(destination, destination)).toBe(true);
    expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  test("closes when leaving and uses the resolved destination rather than fixed coordinates", () => {
    const onOpenChange = vi.fn();
    const visit = createEntryExplorationPlaceVisit({ radius: 1, onOpenChange });
    const mobileDestination = { x: -5, z: 40 };
    expect(visit.update(destination, mobileDestination)).toBe(false);
    expect(visit.update(mobileDestination, mobileDestination)).toBe(true);
    visit.update(destination, mobileDestination);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("resets entry suppression when a scene is recreated", () => {
    const onOpenChange = vi.fn();
    const visit = createEntryExplorationPlaceVisit({ radius: 1, onOpenChange });
    visit.update(destination, destination);
    visit.reset();
    expect(visit.update(destination, destination)).toBe(true);
    expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
  });
});
