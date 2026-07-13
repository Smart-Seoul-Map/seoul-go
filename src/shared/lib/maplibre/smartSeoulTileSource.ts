import { addProtocol } from "maplibre-gl";

import { HTTP_HEADERS } from "@shared/constants/api";
import {
  SMART_SEOUL_RASTER_PROTOCOL,
  SMART_SEOUL_RASTER_TILE_TEMPLATE,
} from "@shared/constants/map";

import {
  SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH,
  buildSmartSeoulRasterTileProxyUrl,
  buildSmartSeoulRasterTileUrl,
  type BuildSmartSeoulRasterTileUrlOptions,
  type SmartSeoulTileCoordinate,
} from "./smartSeoulTileUrl";

export { SMART_SEOUL_RASTER_PROTOCOL, SMART_SEOUL_RASTER_TILE_TEMPLATE };

export const SMART_SEOUL_RASTER_TILE_ACCEPT_HEADER = HTTP_HEADERS.SMART_SEOUL_RASTER_TILE_ACCEPT;

let isSmartSeoulProtocolRegistered = false;

export {
  SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH,
  buildSmartSeoulRasterTileProxyUrl,
  buildSmartSeoulRasterTileUrl,
};
export type { BuildSmartSeoulRasterTileUrlOptions, SmartSeoulTileCoordinate };

type RegisterSmartSeoulRasterProtocolOptions = {
  fetchImpl?: typeof fetch;
  proxyBasePath?: string;
};

export function parseSmartSeoulRasterProtocolUrl(url: string): SmartSeoulTileCoordinate | null {
  const match = /^smartseoul:\/\/raster\/(\d+)\/(\d+)\/(\d+)$/.exec(url);

  if (!match) {
    return null;
  }

  return {
    z: Number(match[1]),
    x: Number(match[2]),
    y: Number(match[3]),
  };
}

export function isSmartSeoulTileImageResponse(response: Response): boolean {
  return response.headers.get("Content-Type")?.toLowerCase().startsWith("image/") ?? false;
}

export function registerSmartSeoulRasterProtocol({
  fetchImpl = fetch,
  proxyBasePath = SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH,
}: RegisterSmartSeoulRasterProtocolOptions = {}): void {
  if (isSmartSeoulProtocolRegistered) {
    return;
  }

  addProtocol(SMART_SEOUL_RASTER_PROTOCOL, async (requestParameters, abortController) => {
    const coordinate = parseSmartSeoulRasterProtocolUrl(requestParameters.url);

    if (!coordinate) {
      throw new Error(`Invalid Smart Seoul tile URL: ${requestParameters.url}`);
    }

    const tileProxyUrl = buildSmartSeoulRasterTileProxyUrl({ proxyBasePath, ...coordinate });
    const response = await fetchImpl(tileProxyUrl, {
      headers: {
        Accept: SMART_SEOUL_RASTER_TILE_ACCEPT_HEADER,
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Smart Seoul tile request failed: ${response.status}`);
    }

    if (!isSmartSeoulTileImageResponse(response)) {
      throw new Error("Smart Seoul tile response is not an image.");
    }

    return {
      data: await response.arrayBuffer(),
    };
  });

  isSmartSeoulProtocolRegistered = true;
}
