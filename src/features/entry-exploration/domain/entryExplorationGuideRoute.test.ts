import { expect, test } from "vitest";

import { createEntryExplorationGuideRoute } from "./entryExplorationGuideRoute";

const options = {
  origin: { x: 0, z: 3.8 },
  towerPosition: { x: 23, z: 15 },
  cameraOffset: { x: 11, y: 13, z: 11 },
};

test("ends exactly at the tower base without a front or lateral offset", () => {
  expect(createEntryExplorationGuideRoute(options).destination).toEqual(options.towerPosition);
});

test("starts down-screen and finishes rightward with a rounded L bend", () => {
  const route = createEntryExplorationGuideRoute(options);
  const down = { x: Math.SQRT1_2, z: Math.SQRT1_2 };
  const right = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
  const first = {
    x: route.bendStart.x - route.start.x,
    z: route.bendStart.z - route.start.z,
  };
  const last = {
    x: route.destination.x - route.bendEnd.x,
    z: route.destination.z - route.bendEnd.z,
  };
  expect(first.x * down.x + first.z * down.z).toBeGreaterThan(0);
  expect(first.x * right.x + first.z * right.z).toBeCloseTo(0);
  expect(last.x * right.x + last.z * right.z).toBeGreaterThan(0);
  expect(last.x * down.x + last.z * down.z).toBeCloseTo(0);
  expect(route.start.x).toBeGreaterThan(options.origin.x);
  expect(route.start.z).toBeGreaterThan(options.origin.z);
});

test("uses the resolved tower position and translates the entire route with the scene", () => {
  const route = createEntryExplorationGuideRoute(options);
  const translated = createEntryExplorationGuideRoute({
    ...options,
    origin: { x: 8, z: -1.2 },
    towerPosition: { x: 31, z: 10 },
  });
  for (const key of ["start", "bendStart", "bendControl", "bendEnd", "destination"] as const) {
    expect(translated[key].x - route[key].x).toBeCloseTo(8);
    expect(translated[key].z - route[key].z).toBeCloseTo(-5);
  }
});
