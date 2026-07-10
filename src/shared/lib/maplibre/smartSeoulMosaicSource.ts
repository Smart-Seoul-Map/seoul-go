import type {
  ImageSource,
  ImageSourceSpecification,
  LngLatLike,
  Map as MapLibreMap,
} from "maplibre-gl";

import { HTTP_HEADERS } from "@shared/constants/api";
import {
  MAP_STYLE_COLORS,
  MAP_STYLE_LAYER_IDS,
  MAP_STYLE_SOURCE_IDS,
  SMART_SEOUL_MAP_ID,
  SMART_SEOUL_MAP_KIND,
  SMART_SEOUL_MOSAIC_MAX_CONCURRENT_TILE_REQUESTS,
  SMART_SEOUL_MOSAIC_REFRESH_TILE_SPAN,
  SMART_SEOUL_MOSAIC_TILE_CACHE_LIMIT,
  SMART_SEOUL_MOSAIC_TILE_RADIUS,
  SMART_SEOUL_MOSAIC_ZOOM,
  SMART_SEOUL_TILE_ORIGIN,
  SMART_SEOUL_TILE_SIZE,
} from "@shared/constants/map";

import {
  SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH,
  buildSmartSeoulRasterTileGridPath,
  convertWgs84ToSmartSeoulTileGrid,
  getSmartSeoulResolution,
  getSmartSeoulTileRows,
  projectEpsg5179ToWgs84,
} from "./smartSeoulTileUrl";

export { SMART_SEOUL_MOSAIC_TILE_RADIUS, SMART_SEOUL_MOSAIC_ZOOM };

export const SMART_SEOUL_MOSAIC_SOURCE_ID = MAP_STYLE_SOURCE_IDS.SMART_SEOUL_MOSAIC;
export const SMART_SEOUL_MOSAIC_LAYER_ID = MAP_STYLE_LAYER_IDS.SMART_SEOUL_MOSAIC;

type SmartSeoulMosaicTile = {
  column: number;
  row: number;
  url: string;
};

type SmartSeoulMosaicDescriptor = {
  key: string;
  canvasSize: number;
  coordinates: ImageSourceSpecification["coordinates"];
  tiles: SmartSeoulMosaicTile[];
};

type SmartSeoulMosaicCenter = {
  longitude: number;
  latitude: number;
};

type SmartSeoulMosaicTileGrid = {
  x: number;
  y: number;
};

type BuildSmartSeoulMosaicDescriptorOptions = {
  center: SmartSeoulMosaicCenter;
  proxyBasePath?: string;
  radius?: number;
  zoom?: number;
};

type SmartSeoulMosaicImage = {
  key: string;
  url: string;
  coordinates: ImageSourceSpecification["coordinates"];
};

type CreateSmartSeoulMosaicImageOptions = {
  maxConcurrentTileRequests?: number;
  signal?: AbortSignal;
};

const tileBlobCache = new Map<string, Blob>();

export function clearSmartSeoulMosaicTileCache(): void {
  tileBlobCache.clear();
}

function cacheTileBlob(url: string, blob: Blob): void {
  tileBlobCache.set(url, blob);

  if (tileBlobCache.size <= SMART_SEOUL_MOSAIC_TILE_CACHE_LIMIT) {
    return;
  }

  const oldestUrl = tileBlobCache.keys().next().value;

  if (oldestUrl) {
    tileBlobCache.delete(oldestUrl);
  }
}

function createCanvasImageUrl(canvas: HTMLCanvasElement): Promise<string> {
  if (!canvas.toBlob || !URL.createObjectURL) {
    return Promise.resolve(canvas.toDataURL("image/png"));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas image blob is not available."));
        return;
      }

      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}

export function buildSmartSeoulMosaicDescriptor({
  center,
  proxyBasePath = SMART_SEOUL_RASTER_TILE_PROXY_BASE_PATH,
  radius = SMART_SEOUL_MOSAIC_TILE_RADIUS,
  zoom = SMART_SEOUL_MOSAIC_ZOOM,
}: BuildSmartSeoulMosaicDescriptorOptions): SmartSeoulMosaicDescriptor {
  const centerTile = convertWgs84ToSmartSeoulTileGrid({
    longitude: center.longitude,
    latitude: center.latitude,
    z: zoom,
  });
  const snappedCenterTile = snapSmartSeoulMosaicTileGrid(centerTile);
  const tileCount = radius * 2 + 1;
  const minX = snappedCenterTile.x - radius;
  const maxX = snappedCenterTile.x + radius;
  const minY = snappedCenterTile.y - radius;
  const maxY = snappedCenterTile.y + radius;
  const resolution = getSmartSeoulResolution(zoom);
  const tileWorldSize = SMART_SEOUL_TILE_SIZE * resolution;
  const tileRows = getSmartSeoulTileRows(zoom);
  const xWest = SMART_SEOUL_TILE_ORIGIN[0] + minX * tileWorldSize;
  const xEast = SMART_SEOUL_TILE_ORIGIN[0] + (maxX + 1) * tileWorldSize;
  const yNorth = SMART_SEOUL_TILE_ORIGIN[1] - (tileRows - maxY - 1) * tileWorldSize;
  const ySouth = SMART_SEOUL_TILE_ORIGIN[1] - (tileRows - minY) * tileWorldSize;
  const topLeft = projectEpsg5179ToWgs84(xWest, yNorth);
  const topRight = projectEpsg5179ToWgs84(xEast, yNorth);
  const bottomRight = projectEpsg5179ToWgs84(xEast, ySouth);
  const bottomLeft = projectEpsg5179ToWgs84(xWest, ySouth);
  const tiles: SmartSeoulMosaicTile[] = [];

  for (let row = 0; row < tileCount; row += 1) {
    for (let column = 0; column < tileCount; column += 1) {
      const x = minX + column;
      const y = maxY - row;

      tiles.push({
        column,
        row,
        url: `${proxyBasePath}${buildSmartSeoulRasterTileGridPath({
          mapKind: SMART_SEOUL_MAP_KIND,
          mapId: SMART_SEOUL_MAP_ID,
          z: zoom,
          x,
          y,
        })}`,
      });
    }
  }

  return {
    key: buildSmartSeoulMosaicKey({ center, zoom }),
    canvasSize: tileCount * SMART_SEOUL_TILE_SIZE,
    coordinates: [
      [topLeft.longitude, topLeft.latitude],
      [topRight.longitude, topRight.latitude],
      [bottomRight.longitude, bottomRight.latitude],
      [bottomLeft.longitude, bottomLeft.latitude],
    ],
    tiles,
  };
}

export function buildSmartSeoulMosaicKey({
  center,
  zoom = SMART_SEOUL_MOSAIC_ZOOM,
}: Pick<BuildSmartSeoulMosaicDescriptorOptions, "center" | "zoom">): string {
  const centerTile = convertWgs84ToSmartSeoulTileGrid({
    longitude: center.longitude,
    latitude: center.latitude,
    z: zoom,
  });
  const snappedCenterTile = snapSmartSeoulMosaicTileGrid(centerTile);

  return `${zoom}:${snappedCenterTile.x}:${snappedCenterTile.y}`;
}

function snapSmartSeoulMosaicTileGrid({
  x,
  y,
}: SmartSeoulMosaicTileGrid): SmartSeoulMosaicTileGrid {
  return {
    x: Math.round(x / SMART_SEOUL_MOSAIC_REFRESH_TILE_SPAN) * SMART_SEOUL_MOSAIC_REFRESH_TILE_SPAN,
    y: Math.round(y / SMART_SEOUL_MOSAIC_REFRESH_TILE_SPAN) * SMART_SEOUL_MOSAIC_REFRESH_TILE_SPAN,
  };
}

async function loadTileBitmap(url: string, signal?: AbortSignal): Promise<ImageBitmap | null> {
  const cachedBlob = tileBlobCache.get(url);

  if (cachedBlob) {
    return createImageBitmap(cachedBlob);
  }

  const response = await fetch(url, {
    headers: {
      Accept: HTTP_HEADERS.SMART_SEOUL_RASTER_TILE_ACCEPT,
    },
    signal,
  });

  if (!response.ok || !response.headers.get("Content-Type")?.toLowerCase().startsWith("image/")) {
    return null;
  }

  const blob = await response.blob();
  cacheTileBlob(url, blob);

  return createImageBitmap(blob);
}

async function drawMosaicTilesWithLimit({
  context,
  maxConcurrentTileRequests,
  signal,
  tiles,
}: {
  context: CanvasRenderingContext2D;
  maxConcurrentTileRequests: number;
  signal?: AbortSignal;
  tiles: SmartSeoulMosaicTile[];
}): Promise<number> {
  let loadedTileCount = 0;
  let nextTileIndex = 0;
  const workerCount = Math.min(maxConcurrentTileRequests, tiles.length);

  const drawNextTile = async (): Promise<void> => {
    while (nextTileIndex < tiles.length && !signal?.aborted) {
      const tile = tiles[nextTileIndex];
      nextTileIndex += 1;
      const bitmap = await loadTileBitmap(tile.url, signal).catch(() => null);

      if (!bitmap || signal?.aborted) {
        continue;
      }

      context.drawImage(
        bitmap,
        tile.column * SMART_SEOUL_TILE_SIZE,
        tile.row * SMART_SEOUL_TILE_SIZE,
        SMART_SEOUL_TILE_SIZE,
        SMART_SEOUL_TILE_SIZE
      );
      bitmap.close();
      loadedTileCount += 1;
    }
  };

  await Promise.all(Array.from({ length: workerCount }, drawNextTile));

  return loadedTileCount;
}

export async function createSmartSeoulMosaicImage(
  descriptor: SmartSeoulMosaicDescriptor,
  {
    maxConcurrentTileRequests = SMART_SEOUL_MOSAIC_MAX_CONCURRENT_TILE_REQUESTS,
    signal,
  }: CreateSmartSeoulMosaicImageOptions = {}
): Promise<SmartSeoulMosaicImage | null> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is not available.");
  }

  canvas.width = descriptor.canvasSize;
  canvas.height = descriptor.canvasSize;
  context.fillStyle = MAP_STYLE_COLORS.SMART_SEOUL_MOSAIC_FALLBACK;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const loadedTileCount = await drawMosaicTilesWithLimit({
    context,
    maxConcurrentTileRequests,
    signal,
    tiles: descriptor.tiles,
  });

  if (signal?.aborted || loadedTileCount === 0) {
    return null;
  }

  return {
    key: descriptor.key,
    url: await createCanvasImageUrl(canvas),
    coordinates: descriptor.coordinates,
  };
}

export function revokeSmartSeoulMosaicImageUrl(image: SmartSeoulMosaicImage): void {
  if (image.url.startsWith("blob:")) {
    URL.revokeObjectURL(image.url);
  }
}

export function addSmartSeoulMosaicLayer(
  map: MapLibreMap,
  image: SmartSeoulMosaicImage,
  beforeLayerId?: string
): void {
  try {
    if (!map.getSource(SMART_SEOUL_MOSAIC_SOURCE_ID)) {
      map.addSource(SMART_SEOUL_MOSAIC_SOURCE_ID, {
        type: "image",
        url: image.url,
        coordinates: image.coordinates,
      });
      map.addLayer(
        {
          id: SMART_SEOUL_MOSAIC_LAYER_ID,
          source: SMART_SEOUL_MOSAIC_SOURCE_ID,
          type: "raster",
        },
        beforeLayerId
      );
      return;
    }

    const source = map.getSource(SMART_SEOUL_MOSAIC_SOURCE_ID);

    if (source?.type === "image") {
      (source as ImageSource).updateImage({
        url: image.url,
        coordinates: image.coordinates,
      });
    }
  } catch {
    return;
  }
}

export function toSmartSeoulMosaicCenter(center: LngLatLike): SmartSeoulMosaicCenter {
  const lngLat = Array.isArray(center) ? { lng: center[0], lat: center[1] } : center;

  return {
    longitude: "lng" in lngLat ? lngLat.lng : lngLat.lon,
    latitude: lngLat.lat,
  };
}
