import { describe, expect, it, vi } from "vitest";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import {
  EXPLORATION_PLACE_MARKER_IMAGES,
  EXPLORATION_PLACE_MARKERS_LAYER_ID,
  EXPLORATION_PLACE_MARKERS_SOURCE_ID,
} from "../config/explorationPlaceMarkerLayer";
import {
  addExplorationPlaceMarkersLayer,
  getExplorationPlaceMarkerSelection,
  getExplorationPlaceMarkerName,
  updateExplorationPlaceMarkersSource,
} from "./explorationPlaceMarkers";

describe("addExplorationPlaceMarkersLayer", () => {
  it("loads marker images and adds the place marker source and symbol layer", async () => {
    const map = {
      addImage: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getSource: vi.fn(() => undefined),
      hasImage: vi.fn(() => false),
      loadImage: vi.fn(async (url: string) => ({ data: { url } })),
    };

    await addExplorationPlaceMarkersLayer(map as never);

    expect(map.loadImage).toHaveBeenCalledTimes(5);
    expect(map.addImage).toHaveBeenCalledTimes(5);
    expect(map.loadImage.mock.calls.map(([url]) => url)).toEqual(
      EXPLORATION_PLACE_MARKER_IMAGES.map(({ url }) => url)
    );
    expect(map.addSource).toHaveBeenCalledWith(
      EXPLORATION_PLACE_MARKERS_SOURCE_ID,
      expect.objectContaining({ type: "geojson" })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: EXPLORATION_PLACE_MARKERS_LAYER_ID,
        source: EXPLORATION_PLACE_MARKERS_SOURCE_ID,
        type: "symbol",
      })
    );
  });

  it("uses the latest marker data when the marker source is added after image loading", async () => {
    const resolveImageLoads: Array<(value: { data: { url: string } }) => void> = [];
    let placeMarkers: MapMarkerFeatureCollection = { features: [], type: "FeatureCollection" };
    const nextPlaceMarkers: MapMarkerFeatureCollection = {
      features: [
        {
          geometry: { coordinates: [126.990703, 37.532326], type: "Point" },
          id: "place-1",
          properties: {
            id: "place-1",
            imageUrl: "https://example.com/place.jpg",
            markerColor: "#20252b",
            markerImage: "black_closed_box",
            name: "테스트 장소",
            themeId: "theme-1",
            themeName: "테스트 테마",
          },
          type: "Feature",
        },
      ],
      type: "FeatureCollection",
    };
    const map = {
      addImage: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getSource: vi.fn(() => undefined),
      hasImage: vi.fn(() => false),
      loadImage: vi.fn(
        () =>
          new Promise<{ data: { url: string } }>((resolve) => {
            resolveImageLoads.push(resolve);
          })
      ),
    };

    const addLayerPromise = addExplorationPlaceMarkersLayer(map as never, {
      getPlaceMarkers: () => placeMarkers as never,
    });
    placeMarkers = nextPlaceMarkers;
    resolveImageLoads.forEach((resolve, index) => {
      resolve({ data: { url: EXPLORATION_PLACE_MARKER_IMAGES[index].url } });
    });

    await addLayerPromise;

    expect(map.addSource).toHaveBeenCalledWith(
      EXPLORATION_PLACE_MARKERS_SOURCE_ID,
      expect.objectContaining({ data: nextPlaceMarkers })
    );
  });

  it("does not load images or add the layer when the source already exists", async () => {
    const map = {
      addImage: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getSource: vi.fn(() => ({ type: "geojson" })),
      hasImage: vi.fn(),
      loadImage: vi.fn(),
    };

    await addExplorationPlaceMarkersLayer(map as never);

    expect(map.loadImage).not.toHaveBeenCalled();
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
});

describe("updateExplorationPlaceMarkersSource", () => {
  it("updates geojson source data", () => {
    const setData = vi.fn();
    const placeMarkers = { features: [], type: "FeatureCollection" };
    const map = {
      getSource: vi.fn(() => ({ setData, type: "geojson" })),
    };

    updateExplorationPlaceMarkersSource(map as never, placeMarkers as never);

    expect(setData).toHaveBeenCalledWith(placeMarkers);
  });
});

describe("getExplorationPlaceMarkerName", () => {
  it("returns marker name only when feature has a non-empty string name", () => {
    expect(getExplorationPlaceMarkerName({ properties: { name: "장소" } } as never)).toBe("장소");
    expect(getExplorationPlaceMarkerName({ properties: { name: "" } } as never)).toBeNull();
    expect(getExplorationPlaceMarkerName({ properties: { name: 1 } } as never)).toBeNull();
    expect(getExplorationPlaceMarkerName(undefined)).toBeNull();
  });
});

describe("getExplorationPlaceMarkerSelection", () => {
  it("returns card data only when required marker fields exist", () => {
    expect(
      getExplorationPlaceMarkerSelection({
        geometry: { coordinates: [126.9, 37.5] },
        properties: {
          id: "place-1",
          imageUrl: "https://example.com/place.jpg",
          markerColor: "#c92a2a",
          name: "Place",
          themeId: "100032",
          themeName: "Theme",
        },
      })
    ).toEqual({
      id: "place-1",
      imageUrl: "https://example.com/place.jpg",
      markerColor: "#c92a2a",
      name: "Place",
      position: { lat: 37.5, lng: 126.9 },
      themeId: "100032",
      themeName: "Theme",
    });

    expect(getExplorationPlaceMarkerSelection({ properties: { id: "place-1" } })).toBeNull();
  });
});
