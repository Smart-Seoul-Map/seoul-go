import { act, renderHook } from "@testing-library/react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addSmartSeoulMosaicLayer,
  buildSmartSeoulMosaicDescriptor,
  createSmartSeoulMosaicImage,
  revokeSmartSeoulMosaicImageUrl,
} from "@shared/lib/maplibre/smartSeoulMosaicSource";

import { useExplorationSmartSeoulMosaicLayer } from "./useExplorationSmartSeoulMosaicLayer";

vi.mock("@shared/lib/maplibre/smartSeoulMosaicSource", () => ({
  addSmartSeoulMosaicLayer: vi.fn(),
  buildSmartSeoulMosaicDescriptor: vi.fn(({ center }) => ({
    canvasSize: 1,
    coordinates: [],
    key: `${center.longitude}:${center.latitude}`,
    tiles: [],
  })),
  buildSmartSeoulMosaicKey: vi.fn(({ center }) => `${center.longitude}:${center.latitude}`),
  createSmartSeoulMosaicImage: vi.fn(async (descriptor) => ({
    coordinates: [],
    key: descriptor.key,
    url: `blob:${descriptor.key}`,
  })),
  revokeSmartSeoulMosaicImageUrl: vi.fn(),
  toSmartSeoulMosaicCenter: vi.fn(() => ({
    latitude: 37,
    longitude: 126,
  })),
}));

function createMapStub(): MapLibreMap {
  return {
    getCenter: vi.fn(() => ({
      lat: 37,
      lng: 126,
    })),
  } as unknown as MapLibreMap;
}

describe("useExplorationSmartSeoulMosaicLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not request a mosaic when Smart Seoul map tiles are disabled", async () => {
    const { result } = renderHook(() =>
      useExplorationSmartSeoulMosaicLayer({
        beforeLayerId: "place-markers",
      })
    );

    await act(async () => {
      await result.current.requestSmartSeoulMosaic({
        isSmartSeoulMapTileEnabled: false,
        map: createMapStub(),
        proxyBasePath: "/api/smart-seoul-map",
      });
    });

    expect(buildSmartSeoulMosaicDescriptor).not.toHaveBeenCalled();
    expect(createSmartSeoulMosaicImage).not.toHaveBeenCalled();
  });

  it("creates and applies a mosaic image when a new key is requested", async () => {
    const map = createMapStub();
    const { result } = renderHook(() =>
      useExplorationSmartSeoulMosaicLayer({
        beforeLayerId: "place-markers",
      })
    );

    await act(async () => {
      await result.current.requestSmartSeoulMosaic({
        center: {
          latitude: 37.5,
          longitude: 126.9,
        },
        isSmartSeoulMapTileEnabled: true,
        map,
        proxyBasePath: "/api/smart-seoul-map",
      });
    });

    expect(buildSmartSeoulMosaicDescriptor).toHaveBeenCalledWith({
      center: {
        latitude: 37.5,
        longitude: 126.9,
      },
      proxyBasePath: "/api/smart-seoul-map",
    });
    expect(addSmartSeoulMosaicLayer).toHaveBeenCalledWith(
      map,
      {
        coordinates: [],
        key: "126.9:37.5",
        url: "blob:126.9:37.5",
      },
      "place-markers"
    );
  });

  it("skips duplicate mosaic requests for the applied key", async () => {
    const { result } = renderHook(() =>
      useExplorationSmartSeoulMosaicLayer({
        beforeLayerId: "place-markers",
      })
    );
    const request = {
      center: {
        latitude: 37.5,
        longitude: 126.9,
      },
      isSmartSeoulMapTileEnabled: true,
      map: createMapStub(),
      proxyBasePath: "/api/smart-seoul-map",
    };

    await act(async () => {
      await result.current.requestSmartSeoulMosaic(request);
      await result.current.requestSmartSeoulMosaic(request);
    });

    expect(createSmartSeoulMosaicImage).toHaveBeenCalledTimes(1);
  });

  it("revokes the active mosaic image on dispose", async () => {
    const { result } = renderHook(() =>
      useExplorationSmartSeoulMosaicLayer({
        beforeLayerId: "place-markers",
      })
    );

    await act(async () => {
      await result.current.requestSmartSeoulMosaic({
        center: {
          latitude: 37.5,
          longitude: 126.9,
        },
        isSmartSeoulMapTileEnabled: true,
        map: createMapStub(),
        proxyBasePath: "/api/smart-seoul-map",
      });
    });
    act(() => {
      result.current.disposeSmartSeoulMosaicLayer();
    });

    expect(revokeSmartSeoulMosaicImageUrl).toHaveBeenCalledWith({
      coordinates: [],
      key: "126.9:37.5",
      url: "blob:126.9:37.5",
    });
  });
});
