import { act, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { ExplorationMap } from "./ExplorationMap";

type MapEventHandler = (event?: MapClickEvent) => void;
type MapClickEvent = {
  lngLat: {
    lat: number;
    lng: number;
  };
  point: unknown;
};

const maplibreMock = vi.hoisted(() => ({
  instances: [] as Array<{
    emit: (eventName: string, event?: MapClickEvent) => void;
    getLayer: ReturnType<typeof vi.fn>;
    handlers: Map<string, MapEventHandler[]>;
    queryRenderedFeatures: ReturnType<typeof vi.fn>;
  }>,
}));

const characterMovementMock = vi.hoisted(() => ({
  moveTo: vi.fn(),
  stop: vi.fn(),
}));

const placeMarkerLayerMock = vi.hoisted(() => ({
  addExplorationPlaceMarkersLayer: vi.fn(),
  getExplorationPlaceMarkerSelection: vi.fn(),
  updateExplorationPlaceMarkersSource: vi.fn(),
}));

const stationRadiusLayerMock = vi.hoisted(() => ({
  addExplorationStationRadiusLayers: vi.fn(),
}));

vi.mock("maplibre-gl", () => {
  class Map {
    handlers = new globalThis.Map<string, MapEventHandler[]>();

    constructor() {
      maplibreMock.instances.push({
        emit: this.emit.bind(this),
        getLayer: this.getLayer,
        handlers: this.handlers,
        queryRenderedFeatures: this.queryRenderedFeatures,
      });
    }

    addControl = vi.fn();
    getLayer = vi.fn(() => false);
    getZoom = vi.fn(() => 12);
    isStyleLoaded = vi.fn(() => false);
    jumpTo = vi.fn();
    off = vi.fn();
    once = vi.fn((eventName: string, handler: MapEventHandler) => {
      this.on(eventName, handler);
    });
    queryRenderedFeatures = vi.fn(() => []);
    remove = vi.fn();

    on(
      eventName: string,
      handlerOrLayer: MapEventHandler | string,
      maybeHandler?: MapEventHandler
    ) {
      const handler = typeof handlerOrLayer === "string" ? maybeHandler : handlerOrLayer;

      if (!handler) {
        return this;
      }

      const handlers = this.handlers.get(eventName) ?? [];
      handlers.push(handler);
      this.handlers.set(eventName, handlers);

      return this;
    }

    emit(eventName: string, event?: MapClickEvent) {
      this.handlers.get(eventName)?.forEach((handler) => handler(event));
    }
  }

  return {
    default: {
      Map,
      NavigationControl: class {},
      Popup: class {},
    },
  };
});

vi.mock("./CharacterModelOverlay", () => ({
  CharacterModelOverlay: () => <div data-testid="character-model-overlay" />,
}));

vi.mock("../application/explorationMapInteractions", () => ({
  disableExplorationMapDragInteractions: vi.fn(),
}));

vi.mock("../application/explorationPlaceMarkers", () => placeMarkerLayerMock);

vi.mock("../application/explorationStationRadiusLayer", () => stationRadiusLayerMock);

vi.mock("../application/useCharacterMovementController", () => ({
  useCharacterMovementController: () => ({
    getCurrentPosition: vi.fn(),
    getIsMoving: vi.fn(),
    headingRadians: 0,
    modelKey: "idlePrimary",
    moveTo: characterMovementMock.moveTo,
    stop: characterMovementMock.stop,
  }),
}));

function createPlaceMarkers(name: string): MapMarkerFeatureCollection {
  return {
    features: [
      {
        geometry: { coordinates: [126.990703, 37.532326], type: "Point" },
        properties: {
          id: "place-1",
          imageUrl: "",
          markerColor: "#212529",
          markerImage: "black_closed_box",
          name,
          themeId: "theme-1",
          themeName: "Theme",
        },
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  } as MapMarkerFeatureCollection;
}

describe("ExplorationMap", () => {
  test("passes the latest place markers to the marker layer setup", () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mockResolvedValue(undefined);
    const firstPlaceMarkers = createPlaceMarkers("처음 장소");
    const nextPlaceMarkers = createPlaceMarkers("다음 장소");
    const { rerender } = render(<ExplorationMap placeMarkers={firstPlaceMarkers} />);
    const map = maplibreMock.instances[0];

    act(() => {
      map.emit("load");
    });
    rerender(<ExplorationMap placeMarkers={nextPlaceMarkers} />);

    const markerLayerOptions =
      placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mock.calls[0]?.[1];

    expect(markerLayerOptions.getPlaceMarkers()).toBe(nextPlaceMarkers);
  });

  test("adds a fixed station radius around the initial center", () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    const initialCenter = { lat: 37.564718, lng: 126.977108 };
    render(<ExplorationMap initialCenter={initialCenter} stationRadiusMeters={1000} />);
    const map = maplibreMock.instances.at(-1);

    act(() => {
      map?.emit("load");
    });

    expect(stationRadiusLayerMock.addExplorationStationRadiusLayers).toHaveBeenCalledWith(
      expect.anything(),
      initialCenter,
      1000
    );
  });

  test("moves the character when a place marker is clicked", () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    render(<ExplorationMap />);
    const map = maplibreMock.instances.at(-1);
    map?.getLayer.mockReturnValue(true);
    map?.queryRenderedFeatures.mockReturnValue([{ properties: { id: "place-1" } }]);

    act(() => {
      map?.emit("click", {
        lngLat: { lat: 37.532326, lng: 126.990703 },
        point: {},
      });
    });

    expect(characterMovementMock.moveTo).toHaveBeenCalledWith({
      lat: 37.532326,
      lng: 126.990703,
    });
  });
});
