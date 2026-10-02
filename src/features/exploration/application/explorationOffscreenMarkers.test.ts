import { describe, expect, it } from "vitest";

import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import { createOffscreenMarkerIndicators } from "./explorationOffscreenMarkers";

function createFeature(id: string, coordinates: [number, number]): MapMarkerFeature {
  return {
    geometry: { coordinates, type: "Point" },
    id,
    properties: {
      closedMarkerImage: "blue_closed_box",
      id,
      imageUrl: "",
      markerColor: "#1971c2",
      markerImage: "blue_closed_box",
      name: `장소 ${id}`,
      openMarkerImage: "blue_open_box",
      themeId: "1786321258890",
      themeName: "서울에디션25",
    },
    type: "Feature",
  };
}

const placeMarkers: MapMarkerFeatureCollection = {
  features: [
    createFeature("inside", [1, 1]),
    createFeature("north", [2, 2]),
    createFeature("visited", [3, 3]),
  ],
  type: "FeatureCollection",
};
const screenPoints: Record<string, { x: number; y: number }> = {
  "1,1": { x: 400, y: 300 },
  "2,2": { x: 400, y: -400 },
  "3,3": { x: 400, y: -900 },
};

const baseParams = {
  edgeInset: 40,
  mapView: { bearingDegrees: 0, center: { lat: 0, lng: 0 }, pitchDegrees: 0 },
  placeMarkers,
  projectToScreen: ([lng, lat]: [number, number]) => screenPoints[`${lng},${lat}`],
  screenSize: { height: 600, width: 800 },
};

describe("화면 밖 마커 지표 생성", () => {
  it("화면 안 마커와 방문한 마커는 제외하고 화면 밖 마커만 만든다", () => {
    const indicators = createOffscreenMarkerIndicators({
      ...baseParams,
      revealedPlaceIds: new Set(["visited"]),
    });

    expect(indicators).toHaveLength(1);
    expect(indicators[0]).toMatchObject({ id: "north", name: "장소 north", y: 40 });
  });

  it("방문하지 않은 화면 밖 마커는 모두 만든다", () => {
    const indicators = createOffscreenMarkerIndicators({
      ...baseParams,
      revealedPlaceIds: new Set(),
    });

    expect(indicators.map(({ id }) => id)).toEqual(["north", "visited"]);
  });
});
