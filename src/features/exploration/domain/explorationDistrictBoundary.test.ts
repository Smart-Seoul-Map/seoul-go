import { describe, expect, test } from "vitest";

import {
  createExplorationDistrictMask,
  getExplorationDistrictBoundary,
  type ExplorationDistrictBoundaryFeature,
} from "./explorationDistrictBoundary";

describe("탐색 자치구 경계", () => {
  test.each([
    [1, "강남구"],
    [2, "서초구"],
    [3, "종로구"],
    [4, "중구"],
    [5, "송파구"],
    [6, "영등포구"],
    [7, "마포구"],
    [8, "용산구"],
    [9, "강서구"],
    [10, "서대문구"],
    [11, "성동구"],
    [12, "광진구"],
    [13, "관악구"],
    [14, "구로구"],
    [15, "동작구"],
    [16, "성북구"],
    [17, "노원구"],
    [18, "동대문구"],
    [19, "강동구"],
    [20, "양천구"],
    [21, "은평구"],
    [22, "중랑구"],
    [23, "도봉구"],
    [24, "강북구"],
    [25, "금천구"],
  ])("자치구 ID %i에 해당하는 %s 경계를 반환한다", (districtId, districtName) => {
    const boundary = getExplorationDistrictBoundary(districtId);

    expect(boundary?.properties.districtId).toBe(districtId);
    expect(boundary?.properties.name).toBe(districtName);
    expect(boundary?.geometry.type).toBe("Polygon");
  });

  test("경계 데이터가 없는 자치구에는 null을 반환한다", () => {
    expect(getExplorationDistrictBoundary(999)).toBeNull();
    expect(getExplorationDistrictBoundary(undefined)).toBeNull();
  });

  test("지도 전체 영역에서 선택 자치구를 비운 마스크를 만든다", () => {
    const boundary = getExplorationDistrictBoundary(1);

    expect(boundary).not.toBeNull();

    const mask = createExplorationDistrictMask(boundary!);

    expect(mask.geometry.coordinates).toHaveLength(2);
    expect(mask.geometry.coordinates[1]).toEqual(boundary?.geometry.coordinates[0]);
  });

  test("여러 영역으로 나뉜 자치구의 모든 외곽선을 마스크에서 비운다", () => {
    const firstOuterRing: [number, number][] = [
      [126, 37],
      [127, 37],
      [126, 37],
    ];
    const secondOuterRing: [number, number][] = [
      [127, 38],
      [128, 38],
      [127, 38],
    ];
    const boundary: ExplorationDistrictBoundaryFeature = {
      type: "Feature",
      properties: {
        districtId: 1,
        name: "테스트구",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [[firstOuterRing], [secondOuterRing]],
      },
    };

    const mask = createExplorationDistrictMask(boundary);

    expect(mask.geometry.coordinates.slice(1)).toEqual([firstOuterRing, secondOuterRing]);
  });
});
