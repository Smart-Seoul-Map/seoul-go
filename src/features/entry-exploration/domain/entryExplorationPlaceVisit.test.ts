import { describe, expect, test, vi } from "vitest";

import {
  createEntryExplorationPlaceVisit,
  updateClosestEntryExplorationPlaceVisit,
} from "./entryExplorationPlaceVisit";

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

describe("closest entry place visit", () => {
  // Both four-unit arrival radii cover the stretch between x = 1 and x = 4.
  function createOverlappingPlaces() {
    const onNearOpenChange = vi.fn();
    const onFarOpenChange = vi.fn();
    const near = {
      visit: createEntryExplorationPlaceVisit({ radius: 4, onOpenChange: onNearOpenChange }),
      destination: { x: 0, z: 0 },
    };
    const far = {
      visit: createEntryExplorationPlaceVisit({ radius: 4, onOpenChange: onFarOpenChange }),
      destination: { x: 5, z: 0 },
    };

    return { targets: [far, near], near, onNearOpenChange, onFarOpenChange };
  }

  test("opens only the closest place where arrival radii overlap", () => {
    const { targets, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    expect(updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets)).toBe(true);
    expect(onNearOpenChange.mock.calls).toEqual([[true]]);
    expect(onFarOpenChange).not.toHaveBeenCalled();
  });

  test("keeps a single panel open when another overlapping place becomes closer", () => {
    const { targets, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets);
    expect(updateClosestEntryExplorationPlaceVisit({ x: 4, z: 0 }, targets)).toBe(true);
    expect(onNearOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(onFarOpenChange.mock.calls).toEqual([[true]]);
  });

  test("keeps a dismissed closest place closed until leaving and re-entering its radius", () => {
    const { targets, near, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets);
    near.visit.dismiss();
    expect(updateClosestEntryExplorationPlaceVisit({ x: 0.5, z: 0 }, targets)).toBe(false);
    expect(updateClosestEntryExplorationPlaceVisit({ x: -5, z: 0 }, targets)).toBe(false);
    expect(updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets)).toBe(true);
    expect(onNearOpenChange.mock.calls).toEqual([[true], [false], [true]]);
    expect(onFarOpenChange).not.toHaveBeenCalled();
  });

  test("keeps a dismissed place closed when it becomes the closest again without leaving its radius", () => {
    const { targets, near, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets);
    near.visit.dismiss();
    expect(updateClosestEntryExplorationPlaceVisit({ x: 3.5, z: 0 }, targets)).toBe(true);
    expect(updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets)).toBe(false);
    expect(onNearOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(onFarOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("reopens a place closed only by a closer place once it becomes the closest again", () => {
    const { targets, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets);
    updateClosestEntryExplorationPlaceVisit({ x: 3.5, z: 0 }, targets);
    expect(updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets)).toBe(true);
    expect(onNearOpenChange.mock.calls).toEqual([[true], [false], [true]]);
    expect(onFarOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("opens a place that was never shown even after a movement click closed every visit", () => {
    const { targets, near, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    const far = targets[0];
    updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets);
    near.visit.dismiss();
    far.visit.dismiss();
    expect(updateClosestEntryExplorationPlaceVisit({ x: 3.5, z: 0 }, targets)).toBe(true);
    expect(onNearOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(onFarOpenChange.mock.calls).toEqual([[true]]);
  });

  test("forgets a dismissal once the place is left while another place is the closest", () => {
    const { targets, near, onNearOpenChange, onFarOpenChange } = createOverlappingPlaces();
    updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets);
    near.visit.dismiss();
    updateClosestEntryExplorationPlaceVisit({ x: 8.5, z: 0 }, targets);
    expect(updateClosestEntryExplorationPlaceVisit({ x: 1, z: 0 }, targets)).toBe(true);
    expect(onNearOpenChange.mock.calls).toEqual([[true], [false], [true]]);
    expect(onFarOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  test("does nothing without places", () => {
    expect(updateClosestEntryExplorationPlaceVisit(destination, [])).toBe(false);
  });
});
