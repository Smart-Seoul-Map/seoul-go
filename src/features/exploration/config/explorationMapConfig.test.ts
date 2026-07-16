import { describe, expect, it } from "vitest";

import { SMART_SEOUL_TMS_TILE_URL_TEMPLATE } from "@shared/constants/api";

import { resolveExplorationMapTileSourceConfig } from "./explorationMapConfig";

describe("resolveExplorationMapTileSourceConfig", () => {
  it("uses Smart Seoul TMS proxy tiles by default", () => {
    const config = resolveExplorationMapTileSourceConfig({});

    expect(config).toEqual({
      smartSeoulMapTileUrlTemplate: SMART_SEOUL_TMS_TILE_URL_TEMPLATE,
    });
  });

  it("uses custom proxy path when the tile proxy env value is configured", () => {
    const config = resolveExplorationMapTileSourceConfig({
      VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH: "/custom-map-proxy",
    });

    expect(config).toEqual({
      smartSeoulMapTileUrlTemplate:
        "/custom-map-proxy/tms/dawul_kor_normal_3857_20260223/{z}/{y}/{x}.png",
    });
  });
});
