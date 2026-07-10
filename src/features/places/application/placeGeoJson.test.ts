import { describe, expect, test } from "vitest";

import { createPlacesFeatureCollection } from "./placeGeoJson";

describe("장소 GeoJSON 변환", () => {
  test("장소 목록을 MapLibre circle layer에서 쓰는 GeoJSON으로 바꾼다", () => {
    const collection = createPlacesFeatureCollection([
      {
        id: "smart-seoul:100032:place-1",
        sourceContentId: "place-1",
        name: "서울도서관",
        themeId: "100032",
        themeName: "서울 미래유산",
        address: "서울 중구",
        position: {
          lng: 126.97842,
          lat: 37.56668,
        },
      },
    ]);

    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features[0]).toEqual({
      type: "Feature",
      id: "smart-seoul:100032:place-1",
      geometry: {
        type: "Point",
        coordinates: [126.97842, 37.56668],
      },
      properties: {
        id: "smart-seoul:100032:place-1",
        name: "서울도서관",
        themeId: "100032",
        themeName: "서울 미래유산",
        markerColor: "#e03131",
      },
    });
  });
});
