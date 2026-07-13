import { addProtocol } from "maplibre-gl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  SMART_SEOUL_RASTER_TILE_ACCEPT_HEADER,
  SMART_SEOUL_RASTER_TILE_TEMPLATE,
  buildSmartSeoulRasterTileProxyUrl,
  buildSmartSeoulRasterTileUrl,
  isSmartSeoulTileImageResponse,
  parseSmartSeoulRasterProtocolUrl,
  registerSmartSeoulRasterProtocol,
} from "./smartSeoulTileSource";

vi.mock("maplibre-gl", () => ({
  addProtocol: vi.fn(),
}));

describe("Smart Seoul raster tile URL", () => {
  beforeEach(() => {
    vi.mocked(addProtocol).mockClear();
  });

  test("provides a MapLibre custom protocol tile template", () => {
    expect(SMART_SEOUL_RASTER_TILE_TEMPLATE).toBe("smartseoul://raster/{z}/{x}/{y}");
  });

  test("extracts z/x/y from protocol URL", () => {
    expect(parseSmartSeoulRasterProtocolUrl("smartseoul://raster/3/27/9")).toEqual({
      z: 3,
      x: 27,
      y: 9,
    });
  });

  test("converts MapLibre XYZ coordinates to a Smart Seoul tile grid URL", () => {
    const url = buildSmartSeoulRasterTileUrl({
      apiKey: "KEY 123",
      baseUrl: "https://map.seoul.go.kr/openapi/v5",
      mapKind: "base",
      mapId: "dawul_kor_normal",
      z: 13,
      x: 6984,
      y: 3171,
    });

    expect(url).toBe(
      "https://map.seoul.go.kr/openapi/v5/KEY%20123/public/map/base/dawul_kor_normal/11/33/29/1679/1489/png"
    );
  });

  test("builds a same-origin proxy URL that follows the Smart Seoul map spec path", () => {
    expect(
      buildSmartSeoulRasterTileProxyUrl({
        z: 13,
        x: 6984,
        y: 3171,
        proxyBasePath: "/api/smart-seoul-map",
      })
    ).toBe("/api/smart-seoul-map/public/map/base/dawul_kor_normal/11/33/29/1679/1489/png");
  });

  test("does not treat a Smart Seoul JSON error response as a tile image", () => {
    const response = new Response("{}", {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
    });

    expect(isSmartSeoulTileImageResponse(response)).toBe(false);
  });

  test("fetches the same-origin Smart Seoul map spec path from the custom protocol", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(new ArrayBuffer(0), {
          headers: {
            "Content-Type": "image/png",
          },
        })
    );
    registerSmartSeoulRasterProtocol({
      fetchImpl,
      proxyBasePath: "/api/smart-seoul-map",
    });

    const protocolHandler = vi.mocked(addProtocol).mock.calls[0]?.[1];
    const abortController = new AbortController();

    await protocolHandler?.({ url: "smartseoul://raster/13/6984/3171" }, abortController);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/smart-seoul-map/public/map/base/dawul_kor_normal/11/33/29/1679/1489/png",
      {
        headers: {
          Accept: SMART_SEOUL_RASTER_TILE_ACCEPT_HEADER,
        },
        signal: abortController.signal,
      }
    );
  });
});
