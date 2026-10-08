import { describe, expect, test } from "vitest";

import { createPlacesFeatureCollection } from "./placeGeoJson";

describe("createPlacesFeatureCollection", () => {
  test("converts places to MapLibre marker GeoJSON with closed and open marker images", () => {
    const collection = createPlacesFeatureCollection([
      {
        address: "Seoul",
        description: "",
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
        closedMarkerImage: "red_closed_box",
        description: "",
        id: "smart-seoul:100032:place-1",
        imageUrl: "https://example.com/library.jpg",
        markerColor: "#c92a2a",
        markerImage: "red_closed_box",
        markerModelUrl: "/models/markers/100032.glb",
        name: "Library",
        openMarkerImage: "red_open_box",
        themeId: "100032",
        themeName: "Theme",
      },
    });
  });

  test("adds a marker model URL only for linked themes", () => {
    const place = {
      address: "Seoul",
      description: "",
      districtName: "district-a",
      imageUrl: "",
      name: "Place",
      position: { lat: 37.56, lng: 126.97 },
      themeName: "Theme",
    };
    const linkedThemeIds = ["100032", "1741228380725", "1777251935025", "1725252918740", "100575"];
    const collection = createPlacesFeatureCollection([
      ...linkedThemeIds.map((themeId) => ({
        ...place,
        id: `smart-seoul:${themeId}:p`,
        sourceContentId: "p",
        themeId,
      })),
      {
        ...place,
        id: "smart-seoul:1786321258890:p",
        sourceContentId: "p",
        themeId: "1786321258890",
      },
      { ...place, id: "smart-seoul:unknown:p", sourceContentId: "p", themeId: "unknown" },
    ]);

    expect(collection.features.map((feature) => feature.properties.markerModelUrl)).toEqual([
      ...linkedThemeIds.map((themeId) => `/models/markers/${themeId}.glb`),
      undefined,
      undefined,
    ]);
    expect(collection.features[5]?.properties).not.toHaveProperty("markerModelUrl");
    expect(collection.features[6]?.properties).not.toHaveProperty("markerModelUrl");
  });
});
