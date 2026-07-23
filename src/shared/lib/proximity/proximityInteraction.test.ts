import { describe, expect, test } from "vitest";

import { getProximityZonesAtPoint, type ProximityInteractionZone } from "./proximityInteraction";

type Point = {
  x: number;
  y: number;
};

const ZONES: readonly ProximityInteractionZone<Point, "first" | "second">[] = [
  {
    center: { x: 2, y: 2 },
    id: "first-zone",
    interactionId: "first",
    radius: 2,
  },
  {
    center: { x: 8, y: 8 },
    id: "second-zone",
    interactionId: "second",
    radius: 1,
  },
];

const getDistance = (from: Point, to: Point) => Math.hypot(to.x - from.x, to.y - from.y);

describe("proximity interaction", () => {
  test("returns every zone containing the point", () => {
    const zones = getProximityZonesAtPoint({
      getDistance,
      point: { x: 3, y: 2 },
      zones: ZONES,
    });

    expect(zones.map((zone) => zone.id)).toEqual(["first-zone"]);
  });

  test("returns no zone when the point is outside every radius", () => {
    const zones = getProximityZonesAtPoint({
      getDistance,
      point: { x: 5, y: 5 },
      zones: ZONES,
    });

    expect(zones).toHaveLength(0);
  });
});
