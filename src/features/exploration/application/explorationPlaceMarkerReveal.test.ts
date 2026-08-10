import { describe, expect, it } from "vitest";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { createRevealedPlaceMarkers } from "./explorationPlaceMarkerReveal";

function createPlaceMarkers(): MapMarkerFeatureCollection {
  return {
    features: [
      {
        geometry: { coordinates: [126.9, 37.5], type: "Point" },
        id: "closed-place",
        properties: {
          closedMarkerImage: "red_closed_box",
          id: "closed-place",
          imageUrl: "",
          markerColor: "#c92a2a",
          markerImage: "red_closed_box",
          name: "Closed Place",
          openMarkerImage: "red_open_box",
          themeId: "100032",
          themeName: "Theme",
        },
        type: "Feature",
      },
      {
        geometry: { coordinates: [126.91, 37.51], type: "Point" },
        id: "revealed-place",
        properties: {
          closedMarkerImage: "yellow_closed_box",
          id: "revealed-place",
          imageUrl: "",
          markerColor: "#e9a100",
          markerImage: "yellow_closed_box",
          name: "Revealed Place",
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

describe("createRevealedPlaceMarkers", () => {
  it("uses open marker images for revealed places", () => {
    const placeMarkers = createRevealedPlaceMarkers({
      placeMarkers: createPlaceMarkers(),
      revealedPlaceIds: new Set(["revealed-place"]),
    });

    expect(placeMarkers.features[0].properties.markerImage).toBe("red_closed_box");
    expect(placeMarkers.features[1].properties.markerImage).toBe("yellow_open_box");
  });
});
