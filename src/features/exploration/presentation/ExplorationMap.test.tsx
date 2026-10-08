import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

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
    addLayer: ReturnType<typeof vi.fn>;
    emit: (eventName: string, event?: MapClickEvent) => void;
    getLayer: ReturnType<typeof vi.fn>;
    handlers: Map<string, MapEventHandler[]>;
    queryRenderedFeatures: ReturnType<typeof vi.fn>;
  }>,
}));

const characterMovementMock = vi.hoisted(() => ({
  onFrame: null as ((frame: { position: { lat: number; lng: number } }) => void) | null,
  moveInDirection: vi.fn(),
  moveTo: vi.fn(),
  stop: vi.fn(),
}));

const keyboardDirectionMock = vi.hoisted(() => ({
  disabled: false,
  onDirectionChange: null as ((direction: { x: number; y: number }) => void) | null,
}));

const placeMarkerLayerMock = vi.hoisted(() => ({
  addExplorationPlaceMarkersLayer: vi.fn(),
  getExplorationPlaceMarkerSelection: vi.fn(),
  updateExplorationPlaceMarkersSource: vi.fn(),
}));

const modelLayerMock = vi.hoisted(() => ({
  layers: [] as Array<{
    id: string;
    onUnavailable: () => void;
    setMarkers: ReturnType<typeof vi.fn>;
  }>,
  loadPlaceMarkerModel: vi.fn(),
}));

const stationRadiusLayerMock = vi.hoisted(() => ({
  addExplorationStationRadiusLayers: vi.fn(),
}));

vi.mock("maplibre-gl", () => {
  class Map {
    handlers = new globalThis.Map<string, MapEventHandler[]>();

    constructor() {
      maplibreMock.instances.push({
        addLayer: this.addLayer,
        emit: this.emit.bind(this),
        getLayer: this.getLayer,
        handlers: this.handlers,
        queryRenderedFeatures: this.queryRenderedFeatures,
      });
    }

    addControl = vi.fn();
    addLayer = vi.fn();
    getBearing = vi.fn(() => 0);
    getCenter = vi.fn(() => ({ lat: 0, lng: 0 }));
    getContainer = vi.fn(() => document.createElement("div"));
    getLayer = vi.fn(() => false);
    getPitch = vi.fn(() => 0);
    getZoom = vi.fn(() => 12);
    isStyleLoaded = vi.fn(() => false);
    isZooming = vi.fn(() => false);
    jumpTo = vi.fn();
    off = vi.fn();
    once = vi.fn((eventName: string, handler: MapEventHandler) => {
      this.on(eventName, handler);
    });
    project = vi.fn(() => ({ x: 0, y: 0 }));
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
vi.mock("./ExplorationImageYearMarker", () => ({
  ExplorationImageYearMarker: () => <div data-testid="edition-marker" />,
}));

vi.mock("../application/explorationMapInteractions", () => ({
  disableExplorationMapDragInteractions: vi.fn(),
  setExplorationMapZoomEnabled: vi.fn(),
}));

vi.mock("../application/explorationPlaceMarkers", () => placeMarkerLayerMock);

vi.mock("../application/explorationStationRadiusLayer", () => stationRadiusLayerMock);

vi.mock("../application/explorationPlaceMarkerModelLayer", () => ({
  createPlaceMarkerModelLayer: ({ onUnavailable }: { onUnavailable: () => void }) => {
    const layer = { id: "place-marker-models", onUnavailable, setMarkers: vi.fn() };
    modelLayerMock.layers.push(layer);
    return layer;
  },
}));

vi.mock("../application/explorationPlaceMarkerModels", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../application/explorationPlaceMarkerModels")>()),
  loadPlaceMarkerModel: modelLayerMock.loadPlaceMarkerModel,
}));

vi.mock("../application/useCharacterMovementController", () => ({
  useCharacterMovementController: (options: {
    onFrame: (frame: { position: { lat: number; lng: number } }) => void;
  }) => {
    characterMovementMock.onFrame = options.onFrame;
    return {
      getCurrentPosition: vi.fn(),
      getIsMoving: vi.fn(),
      headingRadians: 0,
      modelKey: "idlePrimary",
      moveInDirection: characterMovementMock.moveInDirection,
      moveTo: characterMovementMock.moveTo,
      stop: characterMovementMock.stop,
    };
  },
}));

vi.mock("@shared/lib/character/useKeyboardCharacterDirection", () => ({
  useKeyboardCharacterDirection: ({
    disabled,
    onDirectionChange,
  }: {
    disabled: boolean;
    onDirectionChange: (direction: { x: number; y: number }) => void;
  }) => {
    keyboardDirectionMock.disabled = disabled;
    keyboardDirectionMock.onDirectionChange = onDirectionChange;
  },
}));

vi.mock("@shared/ui/virtual-joystick", () => ({
  AppVirtualJoystick: ({
    disabled,
    onDirectionChange,
  }: {
    disabled: boolean;
    onDirectionChange: (direction: { x: number; y: number }) => void;
  }) => (
    <button
      data-disabled={disabled}
      data-testid="exploration-map-joystick"
      onClick={() => onDirectionChange({ x: 1, y: 0 })}
      type="button"
    />
  ),
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

function createModelMarkers(
  markers: Array<{ id: string; url?: string; coordinates: [number, number] }>
): MapMarkerFeatureCollection {
  return {
    features: markers.map(({ id, url, coordinates }) => ({
      geometry: { coordinates, type: "Point" },
      id,
      properties: {
        closedMarkerImage: "red_closed_box",
        id,
        imageUrl: "",
        markerColor: "#c92a2a",
        markerImage: "red_closed_box",
        name: id,
        openMarkerImage: "red_open_box",
        themeId: "100032",
        themeName: "Theme",
        ...(url ? { markerModelUrl: url } : {}),
      },
      type: "Feature",
    })),
    type: "FeatureCollection",
  };
}

const READY_COORDINATES: [number, number] = [126.990703, 37.532326];
const MODEL_MARKERS = createModelMarkers([
  { id: "ready", url: "/models/markers/ready.glb", coordinates: READY_COORDINATES },
  { id: "empty", url: "/models/markers/empty.glb", coordinates: [126.95, 37.55] },
  { id: "pending", url: "/models/markers/pending.glb", coordinates: [126.96, 37.56] },
  { id: "plain", coordinates: [126.97, 37.57] },
]);

function mockModelLoading() {
  modelLayerMock.loadPlaceMarkerModel.mockImplementation((url: string) => {
    if (url.endsWith("ready.glb")) return Promise.resolve({ parts: [] });
    if (url.endsWith("pending.glb")) return new Promise(() => undefined);
    return Promise.resolve(null);
  });
}

function featureIds(collection: MapMarkerFeatureCollection | readonly { id: string }[]) {
  const features = "features" in collection ? collection.features : collection;
  return features.map((feature) => feature.id);
}

beforeEach(() => {
  vi.clearAllMocks();
  maplibreMock.instances.length = 0;
  modelLayerMock.layers.length = 0;
  modelLayerMock.loadPlaceMarkerModel.mockResolvedValue(null);
  characterMovementMock.onFrame = null;
  placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mockResolvedValue(undefined);
  keyboardDirectionMock.disabled = false;
  keyboardDirectionMock.onDirectionChange = null;
});

afterEach(cleanup);

describe("ExplorationMap", () => {
  test("reports a linked marker asset failure without an unhandled rejection", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mockRejectedValueOnce(
      new Error("asset failed")
    );
    const view = render(
      <ExplorationMap
        placeMarkerPresentation="image-year"
        linkedPlaceMarkers={createPlaceMarkers("Linked")}
      />
    );
    await act(async () => {
      maplibreMock.instances.at(-1)?.emit("load");
    });
    expect(view.getByRole("alert").textContent).toContain("마커");
  });
  test("adds and replaces linked treasures without reconstructing the Edition map", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mockResolvedValue(undefined);
    const base = createPlaceMarkers("Edition");
    const first = createPlaceMarkers("Linked A");
    const second = createPlaceMarkers("Linked B");
    const view = render(
      <ExplorationMap
        placeMarkers={base}
        placeMarkerPresentation="image-year"
        linkedPlaceMarkers={first}
      />
    );
    const instanceCount = maplibreMock.instances.length;
    const map = maplibreMock.instances.at(-1);
    await act(async () => {
      map?.emit("load");
    });
    expect(placeMarkerLayerMock.updateExplorationPlaceMarkersSource).toHaveBeenLastCalledWith(
      expect.anything(),
      first
    );
    view.rerender(
      <ExplorationMap
        placeMarkers={base}
        placeMarkerPresentation="image-year"
        linkedPlaceMarkers={second}
      />
    );
    await act(async () => {
      map?.emit("load");
    });
    expect(maplibreMock.instances).toHaveLength(instanceCount);
    expect(placeMarkerLayerMock.updateExplorationPlaceMarkersSource).toHaveBeenLastCalledWith(
      expect.anything(),
      second
    );
    expect(view.getAllByTestId("edition-marker")).toHaveLength(1);
  });
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
    const onMapMoveRequest = vi.fn();
    render(<ExplorationMap onMapMoveRequest={onMapMoveRequest} />);
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
    expect(onMapMoveRequest).toHaveBeenCalledOnce();
  });

  test("starts directional movement from keyboard input", () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    render(<ExplorationMap />);

    act(() => {
      keyboardDirectionMock.onDirectionChange?.({ x: 1, y: 0 });
    });

    expect(characterMovementMock.moveInDirection).toHaveBeenCalledWith(
      expect.objectContaining({ direction: { x: 1, y: 0 } })
    );
  });

  test("stops directional movement when keyboard input returns to idle", () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    render(<ExplorationMap />);

    act(() => {
      keyboardDirectionMock.onDirectionChange?.({ x: 0, y: 0 });
    });

    expect(characterMovementMock.stop).toHaveBeenCalled();
  });

  test("disables keyboard and joystick input while a place card is active", () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    const { getByTestId } = render(<ExplorationMap hasActivePanel />);

    expect(keyboardDirectionMock.disabled).toBe(true);
    expect(getByTestId("exploration-map-joystick").getAttribute("data-disabled")).toBe("true");
    expect(characterMovementMock.stop).toHaveBeenCalled();
  });

  test("adds the GLB marker model layer once the map loads", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    render(<ExplorationMap placeMarkers={MODEL_MARKERS} />);
    const map = maplibreMock.instances.at(-1);

    expect(map?.addLayer).not.toHaveBeenCalled();
    await act(async () => {
      map?.emit("load");
    });

    expect(modelLayerMock.layers).toHaveLength(1);
    expect(map?.addLayer).toHaveBeenCalledOnce();
    expect(map?.addLayer).toHaveBeenCalledWith(modelLayerMock.layers[0]);
  });

  test("draws ready models in the model layer and keeps only model-less markers as symbols", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    mockModelLoading();
    const revealedPlaceIds = new Set(["ready"]);
    render(<ExplorationMap placeMarkers={MODEL_MARKERS} revealedPlaceIds={revealedPlaceIds} />);
    const map = maplibreMock.instances.at(-1);

    await act(async () => {
      map?.emit("load");
    });
    await act(async () => {
      map?.emit("load");
    });

    expect(modelLayerMock.loadPlaceMarkerModel).toHaveBeenCalledTimes(3);
    const lastSourceMarkers =
      placeMarkerLayerMock.updateExplorationPlaceMarkersSource.mock.calls.at(
        -1
      )?.[1] as MapMarkerFeatureCollection;
    expect(featureIds(lastSourceMarkers)).toEqual(["plain"]);
    const markerLayerOptions =
      placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mock.calls[0]?.[1];
    expect(featureIds(markerLayerOptions.getPlaceMarkers())).toEqual(["plain"]);
    const [modelFeatures, states, revealed] =
      modelLayerMock.layers[0]?.setMarkers.mock.calls.at(-1) ?? [];
    expect(featureIds(modelFeatures)).toEqual(["ready"]);
    expect(states.get("/models/markers/ready.glb")).toEqual({
      status: "ready",
      model: { parts: [] },
    });
    expect(revealed).toBe(revealedPlaceIds);
  });

  test("hides model markers when the model layer is unavailable", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    mockModelLoading();
    render(<ExplorationMap placeMarkers={MODEL_MARKERS} />);
    const map = maplibreMock.instances.at(-1);
    await act(async () => {
      map?.emit("load");
    });

    act(() => modelLayerMock.layers[0]?.onUnavailable());
    await act(async () => {
      map?.emit("load");
    });

    const markerLayerOptions =
      placeMarkerLayerMock.addExplorationPlaceMarkersLayer.mock.calls[0]?.[1];
    expect(featureIds(markerLayerOptions.getPlaceMarkers())).toEqual(["plain"]);
    expect(modelLayerMock.layers[0]?.setMarkers.mock.calls.at(-1)?.[0]).toEqual([]);
    const lastSourceMarkers =
      placeMarkerLayerMock.updateExplorationPlaceMarkersSource.mock.calls.at(
        -1
      )?.[1] as MapMarkerFeatureCollection;
    expect(featureIds(lastSourceMarkers)).toEqual(["plain"]);
  });

  test("still opens a place drawn as a GLB model when the character arrives", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    mockModelLoading();
    placeMarkerLayerMock.getExplorationPlaceMarkerSelection.mockImplementation(
      (feature: { properties: { id: string }; geometry: { coordinates: [number, number] } }) => ({
        id: feature.properties.id,
        position: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
      })
    );
    const onPlaceMarkerSelect = vi.fn();
    render(
      <ExplorationMap placeMarkers={MODEL_MARKERS} onPlaceMarkerSelect={onPlaceMarkerSelect} />
    );
    const map = maplibreMock.instances.at(-1);
    await act(async () => {
      map?.emit("load");
    });
    expect(featureIds(modelLayerMock.layers[0]?.setMarkers.mock.calls.at(-1)?.[0])).toEqual([
      "ready",
    ]);

    act(() => {
      characterMovementMock.onFrame?.({
        position: { lng: READY_COORDINATES[0], lat: READY_COORDINATES[1] },
      });
    });

    expect(onPlaceMarkerSelect).toHaveBeenCalledOnce();
    expect(onPlaceMarkerSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "ready" }));
    expect(characterMovementMock.stop).toHaveBeenCalled();
  });

  test("does not show the marker failure alert when a GLB model is unavailable", async () => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    modelLayerMock.loadPlaceMarkerModel.mockResolvedValue(null);
    const view = render(<ExplorationMap placeMarkers={MODEL_MARKERS} />);
    await act(async () => {
      maplibreMock.instances.at(-1)?.emit("load");
    });

    expect(view.queryByRole("alert")).toBeNull();
  });
});
