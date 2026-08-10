import { describe, expect, test } from "vitest";

import { createPlacesFeatureCollection } from "./placeGeoJson";

describe("createPlacesFeatureCollection", () => {
  test("converts places to MapLibre marker GeoJSON", () => {
    const collection = createPlacesFeatureCollection([
      {
        address: "Seoul",
        districtName: "district-a",
        id: "smart-seoul:100032:place-1",
        imageUrl: "https://example.com/library.jpg",
        name: "Library",
        position: {
          lat: 37.56668,
          lng: 126.97842,
        },
        sourceContentId: "place-1",
        themeId: "100032",
        themeName: "Theme",
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
        imageUrl: "https://example.com/library.jpg",
        markerColor: "#c92a2a",
        markerImage: "red_closed_box",
        name: "Library",
        themeId: "100032",
        themeName: "Theme",
      },
    });
  });
});
