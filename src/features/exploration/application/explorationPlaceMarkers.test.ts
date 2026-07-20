import { describe, expect, it, vi } from "vitest";

import {
  EXPLORATION_PLACE_MARKERS_LAYER_ID,
  EXPLORATION_PLACE_MARKERS_SOURCE_ID,
} from "../config/explorationPlaceMarkerLayer";
import {
  addExplorationPlaceMarkersLayer,
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
      loadImage: vi.fn(async () => ({ data: {} })),
    };

    await addExplorationPlaceMarkersLayer(map as never);

    expect(map.loadImage).toHaveBeenCalledTimes(5);
    expect(map.addImage).toHaveBeenCalledTimes(5);
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
