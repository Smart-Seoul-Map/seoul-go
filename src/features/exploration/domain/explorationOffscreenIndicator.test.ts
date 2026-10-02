import { describe, expect, it } from "vitest";

import {
  calculateGroundDirectionOnScreen,
  calculateOffscreenIndicatorPlacement,
} from "./explorationOffscreenIndicator";

const screenSize = { height: 600, width: 800 };
const northDirection = { x: 0, y: -1 };

describe("화면 밖 마커 지표 위치 계산", () => {
  it("화면 안의 점은 지표를 만들지 않는다", () => {
    expect(
      calculateOffscreenIndicatorPlacement({
        edgeInset: 40,
        groundDirection: { x: -1, y: -1 },
        projectedPoint: { x: 100, y: 100 },
        screenSize,
      })
    ).toBeNull();
  });

  it("북쪽 밖의 점은 위쪽 가장자리에서 위를 가리킨다", () => {
    const placement = calculateOffscreenIndicatorPlacement({
      edgeInset: 40,
      groundDirection: northDirection,
      projectedPoint: { x: 400, y: -500 },
      screenSize,
    });

    expect(placement?.x).toBeCloseTo(400);
    expect(placement?.y).toBeCloseTo(40);
    expect(placement?.angleRadians).toBeCloseTo(-Math.PI / 2);
  });

  it("동쪽 밖의 점은 오른쪽 가장자리에서 오른쪽을 가리킨다", () => {
    const placement = calculateOffscreenIndicatorPlacement({
      edgeInset: 40,
      groundDirection: { x: 1, y: 0 },
      projectedPoint: { x: 2000, y: 300 },
      screenSize,
    });

    expect(placement?.x).toBeCloseTo(760);
    expect(placement?.y).toBeCloseTo(300);
    expect(placement?.angleRadians).toBeCloseTo(0);
  });

  it("대각선 밖의 점은 중심에서 점으로 향하는 선과 가장자리의 교차점에 놓인다", () => {
    const placement = calculateOffscreenIndicatorPlacement({
      edgeInset: 40,
      groundDirection: { x: 800, y: 700 },
      projectedPoint: { x: 1200, y: 1000 },
      screenSize,
    });

    expect(placement?.x).toBeCloseTo(400 + 800 * (260 / 700));
    expect(placement?.y).toBeCloseTo(560);
    expect(placement?.angleRadians).toBeCloseTo(Math.atan2(700, 800));
  });

  it("카메라 뒤로 뒤집혀 투영된 점은 지면 방향을 기준으로 지표를 만든다", () => {
    const placement = calculateOffscreenIndicatorPlacement({
      edgeInset: 40,
      groundDirection: { x: 0, y: 1 },
      projectedPoint: { x: 400, y: 100 },
      screenSize,
    });

    expect(placement?.x).toBeCloseTo(400);
    expect(placement?.y).toBeCloseTo(560);
    expect(placement?.angleRadians).toBeCloseTo(Math.PI / 2);
  });
});

describe("지면 방향의 화면 벡터 계산", () => {
  const from = { lat: 37.5, lng: 127 };

  it("방위각이 0이면 북쪽은 화면 위쪽이다", () => {
    const direction = calculateGroundDirectionOnScreen({
      bearingDegrees: 0,
      from,
      pitchDegrees: 0,
      to: { lat: 37.6, lng: 127 },
    });

    expect(direction.x).toBeCloseTo(0);
    expect(direction.y).toBeLessThan(0);
  });

  it("방위각이 -28이면 북쪽은 화면 오른쪽 위로 기운다", () => {
    const direction = calculateGroundDirectionOnScreen({
      bearingDegrees: -28,
      from,
      pitchDegrees: 0,
      to: { lat: 37.6, lng: 127 },
    });

    expect(direction.x).toBeGreaterThan(0);
    expect(direction.y).toBeLessThan(0);
  });

  it("기울기가 있으면 세로 성분이 줄어든다", () => {
    const flat = calculateGroundDirectionOnScreen({
      bearingDegrees: 0,
      from,
      pitchDegrees: 0,
      to: { lat: 37.6, lng: 127 },
    });
    const tilted = calculateGroundDirectionOnScreen({
      bearingDegrees: 0,
      from,
      pitchDegrees: 60,
      to: { lat: 37.6, lng: 127 },
    });

    expect(tilted.y).toBeCloseTo(flat.y / 2);
  });
});
