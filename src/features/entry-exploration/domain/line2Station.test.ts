import { describe, expect, test, vi } from "vitest";

import {
  createLine2SelectionRoute,
  getLine2RoutePointAtProgress,
  selectRandomLine2Station,
  type Line2Station,
} from "./line2Station";

const STATIONS: readonly Line2Station[] = [
  {
    address: "시청역 주소",
    id: "201",
    location: { lat: 37.564718, lng: 126.977108 },
    name: "시청",
    position: { x: 0, y: 0 },
  },
  {
    address: "을지로입구역 주소",
    id: "202",
    location: { lat: 37.566014, lng: 126.982618 },
    name: "을지로입구",
    position: { x: 10, y: 0 },
  },
  {
    address: "을지로3가역 주소",
    id: "203",
    location: { lat: 37.566295, lng: 126.99191 },
    name: "을지로3가",
    position: { x: 10, y: 10 },
  },
  {
    address: "지선역 주소",
    id: "203-1",
    location: { lat: 37.57, lng: 127 },
    name: "지선역",
    position: { x: 20, y: 10 },
  },
];
const MAIN_LOOP_STATION_IDS = ["201", "202", "203"];
const BRANCH_STATION_IDS = [["203", "203-1"]];

describe("line 2 station", () => {
  test("selects a station with the provided random source", () => {
    expect(
      selectRandomLine2Station(
        STATIONS,
        vi.fn(() => 0)
      ).id
    ).toBe("201");
    expect(
      selectRandomLine2Station(
        STATIONS,
        vi.fn(() => 0.99)
      ).id
    ).toBe("203-1");
  });

  test("creates a route that completes a loop before reaching the target", () => {
    const route = createLine2SelectionRoute({
      branchStationIds: BRANCH_STATION_IDS,
      mainLoopStationIds: MAIN_LOOP_STATION_IDS,
      startStationId: "201",
      stations: STATIONS,
      targetStationId: "203",
    });

    expect(route.map((station) => station.id)).toEqual(["201", "202", "203", "201", "202", "203"]);
  });

  test("returns from a branch and travels outward to a branch target", () => {
    const route = createLine2SelectionRoute({
      branchStationIds: BRANCH_STATION_IDS,
      mainLoopStationIds: MAIN_LOOP_STATION_IDS,
      startStationId: "203-1",
      stations: STATIONS,
      targetStationId: "203-1",
    });

    expect(route.map((station) => station.id)).toEqual([
      "203-1",
      "203",
      "201",
      "202",
      "203",
      "203-1",
    ]);
  });

  test("interpolates a point by the route distance", () => {
    const point = getLine2RoutePointAtProgress(STATIONS.slice(0, 3), 0.25);

    expect(point).toEqual({ x: 5, y: 0 });
  });
});
