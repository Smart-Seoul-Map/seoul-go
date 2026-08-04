import { describe, expect, test, vi } from "vitest";

import { MAP_AREA_FILL_STYLE, MAP_AREA_LINE_STYLE } from "@shared/styles/mapAreaLayerStyle";

import {
  EXPLORATION_STATION_RADIUS_FILL_LAYER_ID,
  EXPLORATION_STATION_RADIUS_LINE_LAYER_ID,
  EXPLORATION_STATION_RADIUS_MASK_SOURCE_ID,
  EXPLORATION_STATION_RADIUS_SOURCE_ID,
} from "../config/explorationStationRadiusLayer";
import {
  addExplorationStationRadiusLayers,
  createExplorationStationRadiusFeature,
  createExplorationStationRadiusMaskFeature,
} from "./explorationStationRadiusLayer";

describe("exploration station radius layer", () => {
  test("creates a closed polygon around the station", () => {
    const feature = createExplorationStationRadiusFeature(
      { lat: 37.564718, lng: 126.977108 },
      1000
    );
    const coordinates = feature.geometry.coordinates[0];

    expect(coordinates).toHaveLength(65);
    expect(coordinates[0]).toEqual(coordinates.at(-1));
  });

  test("creates a mask that keeps the station radius transparent", () => {
    const radiusFeature = createExplorationStationRadiusFeature(
      { lat: 37.564718, lng: 126.977108 },
      1000
    );
    const maskFeature = createExplorationStationRadiusMaskFeature(radiusFeature);

    expect(maskFeature.geometry.coordinates).toHaveLength(2);
    expect(maskFeature.geometry.coordinates[1]).toBe(radiusFeature.geometry.coordinates[0]);
  });

  test("adds the station radius source, fill, and line to the map", () => {
    const addLayer = vi.fn();
    const addSource = vi.fn();
    const map = {
      addLayer,
      addSource,
      getSource: vi.fn(() => undefined),
    };

    addExplorationStationRadiusLayers(map, { lat: 37.564718, lng: 126.977108 }, 1000);

    expect(addSource).toHaveBeenCalledWith(
      EXPLORATION_STATION_RADIUS_MASK_SOURCE_ID,
      expect.objectContaining({ type: "geojson" })
    );
    expect(addSource).toHaveBeenCalledWith(
      EXPLORATION_STATION_RADIUS_SOURCE_ID,
      expect.objectContaining({ type: "geojson" })
    );
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: EXPLORATION_STATION_RADIUS_FILL_LAYER_ID,
        paint: {
          "fill-color": MAP_AREA_FILL_STYLE.color,
          "fill-opacity": MAP_AREA_FILL_STYLE.opacity,
        },
        source: EXPLORATION_STATION_RADIUS_MASK_SOURCE_ID,
        type: "fill",
      })
    );
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: EXPLORATION_STATION_RADIUS_LINE_LAYER_ID,
        paint: {
          "line-color": MAP_AREA_LINE_STYLE.color,
          "line-opacity": MAP_AREA_LINE_STYLE.opacity,
          "line-width": MAP_AREA_LINE_STYLE.width,
        },
        type: "line",
      })
    );
  });

  test("does not add a radius layer without a valid radius", () => {
    const addLayer = vi.fn();
    const addSource = vi.fn();
    const map = {
      addLayer,
      addSource,
      getSource: vi.fn(() => undefined),
    };

    addExplorationStationRadiusLayers(map, { lat: 37.564718, lng: 126.977108 }, undefined);

    expect(addSource).not.toHaveBeenCalled();
    expect(addLayer).not.toHaveBeenCalled();
  });
});
