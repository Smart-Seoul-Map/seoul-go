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
  const position = { lat: 37.5, lng: 126.9 };

  it("returns the nearest marker the character has just entered", () => {
    const place = findNearestArrivedPlaceMarker({
      arrivalRadiusMeters: 25,
      placeMarkers: createPlaceMarkers(),
      position,
      previousPosition: { lat: 37.51, lng: 126.9 },
    });

    expect(place?.id).toBe("nearest-place");
  });

  it("returns a newly entered marker instead of one the character was already inside", () => {
    const place = findNearestArrivedPlaceMarker({
      arrivalRadiusMeters: 25,
      placeMarkers: createPlaceMarkers(),
      position,
      previousPosition: { lat: 37.49985, lng: 126.9 },
    });

    expect(place?.id).toBe("farther-place");
  });

  it("returns the nearest marker in range when there is no previous position", () => {
    const place = findNearestArrivedPlaceMarker({
      arrivalRadiusMeters: 25,
      placeMarkers: createPlaceMarkers(),
      position,
      previousPosition: null,
    });

    expect(place?.id).toBe("nearest-place");
  });

  it("returns null while the character stays inside every marker in range", () => {
    const place = findNearestArrivedPlaceMarker({
      arrivalRadiusMeters: 25,
      placeMarkers: createPlaceMarkers(),
      position,
      previousPosition: position,
    });

    expect(place).toBeNull();
  });
});
