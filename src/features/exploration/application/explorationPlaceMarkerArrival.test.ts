import { describe, expect, it } from "vitest";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { findNearestArrivedPlaceMarker } from "./explorationPlaceMarkerArrival";

function createPlaceMarkers(): MapMarkerFeatureCollection {
  return {
    features: [
      {
        geometry: { coordinates: [126.9001, 37.5001], type: "Point" },
        id: "farther-place",
        properties: {
          closedMarkerImage: "red_closed_box",
          id: "farther-place",
          imageUrl: "",
          markerColor: "#c92a2a",
          markerImage: "red_closed_box",
          name: "Farther Place",
          openMarkerImage: "red_open_box",
          themeId: "100032",
          themeName: "Theme",
        },
        type: "Feature",
      },
      {
        geometry: { coordinates: [126.90001, 37.50001], type: "Point" },
        id: "nearest-place",
        properties: {
          closedMarkerImage: "yellow_closed_box",
          id: "nearest-place",
          imageUrl: "",
          markerColor: "#e9a100",
          markerImage: "yellow_closed_box",
          name: "Nearest Place",
          openMarkerImage: "yellow_open_box",
          themeId: "1741",
          themeName: "Theme",
        },
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };
}

describe("findNearestArrivedPlaceMarker", () => {
  it("returns the nearest unrevealed marker within the arrival radius", () => {
    const place = findNearestArrivedPlaceMarker({
      arrivalRadiusMeters: 25,
      placeMarkers: createPlaceMarkers(),
      position: { lat: 37.5, lng: 126.9 },
      revealedPlaceIds: new Set(["farther-place"]),
    });

    expect(place?.id).toBe("nearest-place");
  });

  it("returns null when every marker in range is already revealed", () => {
    const place = findNearestArrivedPlaceMarker({
      arrivalRadiusMeters: 25,
      placeMarkers: createPlaceMarkers(),
      position: { lat: 37.5, lng: 126.9 },
      revealedPlaceIds: new Set(["farther-place", "nearest-place"]),
    });

    expect(place).toBeNull();
  });
});
