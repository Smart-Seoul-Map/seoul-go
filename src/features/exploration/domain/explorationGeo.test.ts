import { describe, expect, test } from "vitest";

import {
  canMoveWithinRadius,
  distanceMeters,
  hasArrived,
  nextRadius,
  RADIUS_STEPS_METERS,
} from "./explorationGeo";

const cityHall = { lng: 126.9784147, lat: 37.5666805 };
const deoksugung = { lng: 126.975264, lat: 37.565804 };
const namsanTower = { lng: 126.988205, lat: 37.551169 };

describe("서울 지도 탐색 거리 규칙", () => {
  test("두 위경도 사이 거리를 하버사인 공식으로 미터 단위 계산한다", () => {
    const meters = distanceMeters(cityHall, deoksugung);

    expect(meters).toBeGreaterThan(280);
    expect(meters).toBeLessThan(320);
  });

  test("현재 탐색 반경 안의 좌표만 이동 가능하다", () => {
    expect(canMoveWithinRadius(cityHall, deoksugung, 500)).toBe(true);
    expect(canMoveWithinRadius(cityHall, namsanTower, 500)).toBe(false);
  });

  test("도착 반경 안에 들어오면 발견으로 판정한다", () => {
    expect(hasArrived(cityHall, deoksugung, 350)).toBe(true);
    expect(hasArrived(cityHall, namsanTower, 350)).toBe(false);
  });

  test("탐색 반경은 500m 단위로 2000m까지만 확장한다", () => {
    expect(RADIUS_STEPS_METERS).toEqual([500, 1000, 1500, 2000]);
    expect(nextRadius(500)).toBe(1000);
    expect(nextRadius(1000)).toBe(1500);
    expect(nextRadius(1500)).toBe(2000);
    expect(nextRadius(2000)).toBe(2000);
  });
});
