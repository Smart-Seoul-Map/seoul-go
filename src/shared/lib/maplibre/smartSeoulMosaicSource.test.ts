import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SMART_SEOUL_MOSAIC_MAX_CONCURRENT_TILE_REQUESTS } from "@shared/constants/map";

import {
  addSmartSeoulMosaicLayer,
  buildSmartSeoulMosaicDescriptor,
  buildSmartSeoulMosaicKey,
  clearSmartSeoulMosaicTileCache,
  createSmartSeoulMosaicImage,
  SMART_SEOUL_MOSAIC_TILE_RADIUS,
  SMART_SEOUL_MOSAIC_ZOOM,
} from "./smartSeoulMosaicSource";

describe("Smart Seoul mosaic source", () => {
  beforeEach(() => {
    clearSmartSeoulMosaicTileCache();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName !== "canvas") {
        return document.createElement(tagName);
      }

      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          fillRect: vi.fn(),
          fillStyle: "",
        })),
        toBlob: vi.fn((callback: BlobCallback) => {
          callback(new Blob(["mosaic"], { type: "image/png" }));
        }),
        toDataURL: vi.fn(() => "data:image/png;base64,mosaic"),
      } as unknown as HTMLCanvasElement;
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mosaic");
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        close: vi.fn(),
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("keeps the same mosaic key for small movement within the refresh span", () => {
    const center = { longitude: 126.9784147, latitude: 37.5666805 };
    const nearbyCenter = { longitude: center.longitude + 0.0025, latitude: center.latitude };

    expect(buildSmartSeoulMosaicKey({ center: nearbyCenter })).toBe(
      buildSmartSeoulMosaicKey({ center })
    );
  });

  test("builds a stable 5x5 EPSG:5179 tile mosaic around Seoul center", () => {
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
    });

    expect(descriptor.key).toBe(`${SMART_SEOUL_MOSAIC_ZOOM}:3375:2964`);
    expect(descriptor.canvasSize).toBe(1280);
    expect(descriptor.tiles).toHaveLength((SMART_SEOUL_MOSAIC_TILE_RADIUS * 2 + 1) ** 2);
    expect(descriptor.tiles[0]).toMatchObject({
      column: 0,
      row: 0,
      url: "/api/smart-seoul-map/public/map/base/dawul_kor_normal/12/67/59/3373/2966/png",
    });
  });

  test("returns MapLibre image source coordinates ordered clockwise from top-left", () => {
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
    });

    const [topLeft, topRight, bottomRight, bottomLeft] = descriptor.coordinates;

    expect(topLeft[0]).toBeLessThan(topRight[0]);
    expect(bottomLeft[0]).toBeLessThan(bottomRight[0]);
    expect(topLeft[1]).toBeGreaterThan(bottomLeft[1]);
    expect(topRight[1]).toBeGreaterThan(bottomRight[1]);
  });

  test("does not throw when MapLibre source access is no longer available", () => {
    const removedMap = {
      getSource: () => {
        throw new TypeError("Cannot read properties of null (reading 'getSource')");
      },
    };
    const image = {
      key: "12:3374:2965",
      url: "data:image/png;base64,",
      coordinates: [
        [126, 37],
        [127, 37],
        [127, 36],
        [126, 36],
      ] as [[number, number], [number, number], [number, number], [number, number]],
    };

    expect(() => {
      addSmartSeoulMosaicLayer(removedMap as never, image);
    }).not.toThrow();
  });

  test("returns null when every Smart Seoul tile request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { headers: { "Content-Type": "application/json" } }))
    );
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
      radius: 0,
    });

    await expect(createSmartSeoulMosaicImage(descriptor)).resolves.toBeNull();
  });

  test("passes AbortSignal to tile fetches", async () => {
    const abortController = new AbortController();
    const fetchImpl = vi.fn(
      async () =>
        new Response("tile", {
          headers: { "Content-Type": "image/png" },
        })
    );
    vi.stubGlobal("fetch", fetchImpl);
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
      radius: 0,
    });

    await createSmartSeoulMosaicImage(descriptor, { signal: abortController.signal });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: abortController.signal })
    );
  });

  test("creates the mosaic image URL without synchronous data URL encoding", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response("tile", {
          headers: { "Content-Type": "image/png" },
        })
    );
    vi.stubGlobal("fetch", fetchImpl);
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
      radius: 0,
    });

    await expect(createSmartSeoulMosaicImage(descriptor)).resolves.toMatchObject({
      url: "blob:mosaic",
    });
  });

  test("limits concurrent Smart Seoul tile fetches", async () => {
    let activeRequests = 0;
    let maxActiveRequests = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Promise<Response>((resolve) => {
            activeRequests += 1;
            maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
            setTimeout(() => {
              activeRequests -= 1;
              resolve(
                new Response("tile", {
                  headers: { "Content-Type": "image/png" },
                })
              );
            }, 0);
          })
      )
    );
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
      radius: 1,
    });

    await createSmartSeoulMosaicImage(descriptor);

    expect(maxActiveRequests).toBeLessThanOrEqual(SMART_SEOUL_MOSAIC_MAX_CONCURRENT_TILE_REQUESTS);
  });

  test("reuses cached Smart Seoul tile responses for repeated mosaics", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response("tile", {
          headers: { "Content-Type": "image/png" },
        })
    );
    vi.stubGlobal("fetch", fetchImpl);
    const descriptor = buildSmartSeoulMosaicDescriptor({
      center: { longitude: 126.9784147, latitude: 37.5666805 },
      proxyBasePath: "/api/smart-seoul-map",
      radius: 0,
    });

    await createSmartSeoulMosaicImage(descriptor);
    await createSmartSeoulMosaicImage(descriptor);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
