import { describe, expect, it } from "vitest";

import { API_PROXY_PATH } from "@shared/constants/api";

import { resolveExplorationMapTileSourceConfig } from "./explorationMapConfig";

describe("resolveExplorationMapTileSourceConfig", () => {
  it("uses fallback raster tiles when Smart Seoul map env values are missing", () => {
    const config = resolveExplorationMapTileSourceConfig({});

    expect(config).toEqual({
      isSmartSeoulMapTileEnabled: false,
      smartSeoulMapTileProxyPath: API_PROXY_PATH.SMART_SEOUL_MAP,
    });
  });

  it("uses Smart Seoul map tiles when a map key is configured", () => {
    const config = resolveExplorationMapTileSourceConfig({
      VITE_SMART_SEOUL_MAP_KEY: "map-key",
    });

    expect(config).toEqual({
      isSmartSeoulMapTileEnabled: true,
      smartSeoulMapTileProxyPath: API_PROXY_PATH.SMART_SEOUL_MAP,
    });
  });

  it("uses custom proxy path when the tile proxy env value is configured", () => {
    const config = resolveExplorationMapTileSourceConfig({
      VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH: "/custom-map-proxy",
    });

    expect(config).toEqual({
      isSmartSeoulMapTileEnabled: true,
      smartSeoulMapTileProxyPath: "/custom-map-proxy",
    });
  });
});
