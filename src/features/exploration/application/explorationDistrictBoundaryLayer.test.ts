import { describe, expect, test, vi } from "vitest";

import { MAP_AREA_FILL_STYLE, MAP_AREA_LINE_STYLE } from "@shared/styles/mapAreaLayerStyle";

import {
  EXPLORATION_DISTRICT_BOUNDARY_LAYER_ID,
  EXPLORATION_DISTRICT_BOUNDARY_SOURCE_ID,
  EXPLORATION_DISTRICT_MASK_LAYER_ID,
  EXPLORATION_DISTRICT_MASK_SOURCE_ID,
} from "../config/explorationDistrictBoundaryLayer";
import { getExplorationDistrictBoundary } from "../domain/explorationDistrictBoundary";
import { addExplorationDistrictBoundaryLayers } from "./explorationDistrictBoundaryLayer";

describe("탐색 자치구 경계 레이어", () => {
  test("선택 자치구 바깥 마스크와 경계선을 지도에 추가한다", () => {
    const addLayer = vi.fn();
    const addSource = vi.fn();
    const map = {
      addLayer,
      addSource,
      getSource: vi.fn(() => undefined),
    };

    addExplorationDistrictBoundaryLayers(map, getExplorationDistrictBoundary(1));

    expect(addSource).toHaveBeenCalledWith(
      EXPLORATION_DISTRICT_MASK_SOURCE_ID,
      expect.objectContaining({ type: "geojson" })
    );
    expect(addSource).toHaveBeenCalledWith(
      EXPLORATION_DISTRICT_BOUNDARY_SOURCE_ID,
      expect.objectContaining({ type: "geojson" })
    );
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: EXPLORATION_DISTRICT_MASK_LAYER_ID,
        paint: {
          "fill-color": MAP_AREA_FILL_STYLE.color,
          "fill-opacity": MAP_AREA_FILL_STYLE.opacity,
        },
        type: "fill",
      })
    );
    expect(addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: EXPLORATION_DISTRICT_BOUNDARY_LAYER_ID,
        paint: {
          "line-color": MAP_AREA_LINE_STYLE.color,
          "line-opacity": MAP_AREA_LINE_STYLE.opacity,
          "line-width": MAP_AREA_LINE_STYLE.width,
        },
        type: "line",
      })
    );
  });

  test("경계 데이터가 없으면 지도 레이어를 추가하지 않는다", () => {
    const addLayer = vi.fn();
    const addSource = vi.fn();
    const map = {
      addLayer,
      addSource,
      getSource: vi.fn(() => undefined),
    };

    addExplorationDistrictBoundaryLayers(map, null);

    expect(addSource).not.toHaveBeenCalled();
    expect(addLayer).not.toHaveBeenCalled();
  });
});
