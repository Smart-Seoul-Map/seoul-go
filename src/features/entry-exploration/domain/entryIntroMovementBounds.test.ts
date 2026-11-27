import { describe, expect, it } from "vitest";

import {
  clampEntryIntroCameraFocus,
  clampEntryIntroMovementPoint,
  createEntryIntroMovementBounds,
  getEntryIntroCameraGroundHalfExtent,
} from "./entryIntroMovementBounds";

const ALIGNED_CAMERA_OFFSET = { x: 0, z: 1 };
const NO_MARGIN = { across: 0, along: 0 };

describe("createEntryIntroMovementBounds", () => {
  it("모든 지점을 감싸는 사각형에 여백을 더한다", () => {
    const bounds = createEntryIntroMovementBounds({
      cameraOffset: ALIGNED_CAMERA_OFFSET,
      padding: 2,
      points: [
        { x: -10, z: 5 },
        { x: 20, z: -3 },
      ],
    });

    expect(bounds.minAlong).toBe(-5);
    expect(bounds.maxAlong).toBe(7);
    expect(bounds.minAcross).toBe(-12);
    expect(bounds.maxAcross).toBe(22);
  });
});

describe("clampEntryIntroMovementPoint", () => {
  const bounds = createEntryIntroMovementBounds({
    cameraOffset: ALIGNED_CAMERA_OFFSET,
    padding: 0,
    points: [
      { x: -10, z: -10 },
      { x: 10, z: 10 },
    ],
  });

  it("사각형 안의 지점은 같은 객체로 그대로 둔다", () => {
    const point = { x: 3, z: -4 };

    expect(clampEntryIntroMovementPoint(point, bounds, NO_MARGIN)).toBe(point);
  });

  it("사각형 밖의 지점은 가장 가까운 경계로 옮긴다", () => {
    const point = clampEntryIntroMovementPoint({ x: 30, z: -50 }, bounds, NO_MARGIN);

    expect(point.x).toBeCloseTo(10);
    expect(point.z).toBeCloseTo(-10);
  });

  it("캐릭터 여백만큼 벽 안쪽에서 멈춘다", () => {
    const point = clampEntryIntroMovementPoint({ x: 30, z: -50 }, bounds, {
      across: 1,
      along: 3,
    });

    expect(point.x).toBeCloseTo(9);
    expect(point.z).toBeCloseTo(-7);
  });

  it("카메라가 비스듬해도 화면 기준 사각형으로 제한한다", () => {
    const diagonalBounds = createEntryIntroMovementBounds({
      cameraOffset: { x: 1, z: 1 },
      padding: 0,
      points: [
        { x: 0, z: 0 },
        { x: 1, z: 1 },
      ],
    });
    const point = clampEntryIntroMovementPoint({ x: 5, z: 5 }, diagonalBounds, NO_MARGIN);

    expect(point.x).toBeCloseTo(1);
    expect(point.z).toBeCloseTo(1);
  });
});

describe("getEntryIntroCameraGroundHalfExtent", () => {
  it("화면 세로는 카메라 기울기만큼 바닥에서 더 길게 덮는다", () => {
    const extent = getEntryIntroCameraGroundHalfExtent({
      cameraOffset: { x: 0, y: 3, z: 4 },
      viewHalfHeight: 6,
      viewHalfWidth: 8,
      zoom: 2,
    });

    expect(extent.across).toBeCloseTo(4);
    expect(extent.along).toBeCloseTo(5);
  });
});

describe("clampEntryIntroCameraFocus", () => {
  const bounds = createEntryIntroMovementBounds({
    cameraOffset: ALIGNED_CAMERA_OFFSET,
    padding: 0,
    points: [
      { x: -10, z: -10 },
      { x: 10, z: 10 },
    ],
  });
  const halfExtent = { across: 4, along: 3 };

  it("벽에서 먼 캐릭터는 그대로 따라간다", () => {
    const point = { x: 2, z: -1 };

    expect(clampEntryIntroCameraFocus(point, bounds, halfExtent)).toBe(point);
  });

  it("벽 근처에서는 화면 끝이 벽을 넘지 않는 곳에서 멈춘다", () => {
    const focus = clampEntryIntroCameraFocus({ x: -9, z: 9 }, bounds, halfExtent);

    expect(focus.x).toBeCloseTo(-6);
    expect(focus.z).toBeCloseTo(7);
  });

  it("범위가 화면보다 좁은 방향은 범위 중앙에 고정한다", () => {
    const focus = clampEntryIntroCameraFocus({ x: 8, z: 0 }, bounds, {
      across: 15,
      along: 3,
    });

    expect(focus.x).toBeCloseTo(0);
    expect(focus.z).toBeCloseTo(0);
  });
});
