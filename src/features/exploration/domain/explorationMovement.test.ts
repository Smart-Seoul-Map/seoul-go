import { describe, expect, test } from "vitest";

import { advanceMovement, createMovement } from "./explorationMovement";

const start = { lng: 126.9784147, lat: 37.5666805 };
const target = { lng: 126.975264, lat: 37.565804 };

describe("character movement state", () => {
  test("creates a moving state toward the target coordinate", () => {
    const movement = createMovement(start, target);

    expect(movement.status).toBe("moving");
    expect(movement.position).toEqual(start);
    expect(movement.target).toEqual(target);
  });

  test("advances toward the target while moving", () => {
    const movement = createMovement(start, target);
    const next = advanceMovement(movement, 1, 2);

    expect(next.status).toBe("moving");
    expect(next.position.lng).toBeLessThan(start.lng);
    expect(next.position.lat).toBeLessThan(start.lat);
  });

  test("marks arrived without snapping when already inside the arrival radius", () => {
    const movement = createMovement(start, target, 350);
    const next = advanceMovement(movement, 1, 2);

    expect(next.status).toBe("arrived");
    expect(next.position).toEqual(start);
  });

  test("stops near the target without snapping directly to the clicked point", () => {
    const movement = createMovement(start, target, 25);
    const next = advanceMovement(movement, 10, 100);

    expect(next.status).toBe("arrived");
    expect(next.position).not.toEqual(target);
    expect(next.position.lng).toBeLessThan(start.lng);
    expect(next.position.lat).toBeLessThan(start.lat);
  });
});
