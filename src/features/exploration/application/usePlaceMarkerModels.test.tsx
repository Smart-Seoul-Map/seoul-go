import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import type { PlaceMarkerModel } from "./explorationPlaceMarkerModels";
import { usePlaceMarkerModels } from "./usePlaceMarkerModels";

const modelLoaderMock = vi.hoisted(() => ({
  loadPlaceMarkerModel: vi.fn(),
}));

vi.mock("./explorationPlaceMarkerModels", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./explorationPlaceMarkerModels")>()),
  loadPlaceMarkerModel: modelLoaderMock.loadPlaceMarkerModel,
}));

const readyModel: PlaceMarkerModel = { parts: [] };

function createFeature(id: string, markerModelUrl?: string): MapMarkerFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [126.97, 37.56] },
    properties: {
      id,
      imageUrl: "",
      name: id,
      themeId: "100032",
      themeName: "Theme",
      markerColor: "#c92a2a",
      closedMarkerImage: "red_closed_box",
      markerImage: "red_closed_box",
      openMarkerImage: "red_open_box",
      ...(markerModelUrl ? { markerModelUrl } : {}),
    },
  };
}

function createCollection(...features: MapMarkerFeature[]): MapMarkerFeatureCollection {
  return { type: "FeatureCollection", features };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

beforeEach(() => {
  modelLoaderMock.loadPlaceMarkerModel.mockReset();
});

afterEach(cleanup);

describe("usePlaceMarkerModels", () => {
  test("reports ready and unavailable models per URL", async () => {
    modelLoaderMock.loadPlaceMarkerModel.mockImplementation(async (url: string) =>
      url === "/ready.glb" ? readyModel : null
    );

    const { result } = renderHook(() =>
      usePlaceMarkerModels(
        createCollection(
          createFeature("a", "/ready.glb"),
          createFeature("b", "/empty.glb"),
          createFeature("c")
        )
      )
    );

    expect(result.current.size).toBe(0);
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.get("/ready.glb")).toEqual({ status: "ready", model: readyModel });
    expect(result.current.get("/empty.glb")).toEqual({ status: "unavailable" });
  });

  test("requests each URL once across marker updates", async () => {
    modelLoaderMock.loadPlaceMarkerModel.mockResolvedValue(readyModel);
    const { result, rerender } = renderHook(({ markers }) => usePlaceMarkerModels(markers), {
      initialProps: { markers: createCollection(createFeature("a", "/a.glb")) },
    });
    await waitFor(() => expect(result.current.size).toBe(1));

    rerender({
      markers: createCollection(createFeature("a", "/a.glb"), createFeature("a-2", "/a.glb")),
    });
    rerender({ markers: createCollection(createFeature("b", "/b.glb")) });
    await waitFor(() => expect(result.current.size).toBe(2));
    rerender({ markers: createCollection() });
    rerender({
      markers: createCollection(createFeature("a", "/a.glb"), createFeature("b", "/b.glb")),
    });

    expect(modelLoaderMock.loadPlaceMarkerModel.mock.calls.map(([url]) => url)).toEqual([
      "/a.glb",
      "/b.glb",
    ]);
    expect(result.current.get("/a.glb")?.status).toBe("ready");
  });

  test("does not load anything without model URLs", () => {
    const { result } = renderHook(() =>
      usePlaceMarkerModels(createCollection(createFeature("a"), createFeature("b")))
    );

    expect(result.current.size).toBe(0);
    expect(modelLoaderMock.loadPlaceMarkerModel).not.toHaveBeenCalled();
  });

  test("ignores a model that finishes loading after unmount", async () => {
    const pending = deferred<PlaceMarkerModel | null>();
    modelLoaderMock.loadPlaceMarkerModel.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() =>
      usePlaceMarkerModels(createCollection(createFeature("a", "/late.glb")))
    );

    unmount();
    await act(async () => {
      pending.resolve(readyModel);
      await pending.promise;
    });

    expect(result.current.size).toBe(0);
  });
});
