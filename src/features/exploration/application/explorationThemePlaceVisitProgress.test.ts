import { describe, expect, it } from "vitest";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { applyVisitedPlaceCountsToThemeProgressItems } from "./explorationThemePlaceVisitProgress";

const themeProgressItems = [
  {
    id: "all",
    markerColor: null,
    markerColorToken: null,
    name: "Visited",
    totalCount: 3,
    visitedCount: 0,
  },
  {
    id: "night",
    markerColor: "#1971c2",
    markerColorToken: "--sg-place-theme-blue",
    name: "Night",
    totalCount: 2,
    visitedCount: 0,
  },
  {
    id: "art",
    markerColor: "#8b5cf6",
    markerColorToken: "--sg-place-theme-purple",
    name: "Art",
    totalCount: 1,
    visitedCount: 0,
  },
] as const;

describe("applyVisitedPlaceCountsToThemeProgressItems", () => {
  it("counts visited places by all places and theme", () => {
    const items = applyVisitedPlaceCountsToThemeProgressItems({
      placeMarkers: createPlaceMarkers(),
      themeProgressItems,
      visitedPlaceIds: new Set(["place-1", "place-3", "unknown-place"]),
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: "all",
        totalCount: 3,
        visitedCount: 2,
      }),
      expect.objectContaining({
        id: "night",
        totalCount: 2,
        visitedCount: 1,
      }),
      expect.objectContaining({
        id: "art",
        totalCount: 1,
        visitedCount: 1,
      }),
    ]);
  });
});

function createPlaceMarkers(): MapMarkerFeatureCollection {
  return {
    features: [
      createPlaceMarker({ id: "place-1", themeId: "night" }),
      createPlaceMarker({ id: "place-2", themeId: "night" }),
      createPlaceMarker({ id: "place-3", themeId: "art" }),
    ],
    type: "FeatureCollection",
  };
}

function createPlaceMarker({ id, themeId }: { id: string; themeId: string }) {
  return {
    geometry: { coordinates: [126.9, 37.5] as [number, number], type: "Point" as const },
    id,
    properties: {
      closedMarkerImage: "closed_box",
      id,
      imageUrl: "",
      markerColor: "#1971c2",
      markerImage: "closed_box",
      name: id,
      openMarkerImage: "open_box",
      themeId,
      themeName: themeId,
    },
    type: "Feature" as const,
  };
}
