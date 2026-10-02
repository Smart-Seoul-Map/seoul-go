import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { stampCourseStore } from "@features/course";
import {
  unlockedLinkedPlaceStore,
  createUnlockedLinkedPlaceStore,
  UNLOCKED_LINKED_PLACE_STORAGE_KEY,
} from "@features/exploration";
import type { SmartSeoulThemePlace } from "@features/places";
import { useLinkedPlaceExploration } from "./useLinkedPlaceExploration";

const { getNearbySmartSeoulPlaces, getSmartSeoulThemeApiKey } = vi.hoisted(() => ({
  getNearbySmartSeoulPlaces: vi.fn(
    async (): Promise<{ place: SmartSeoulThemePlace; distance: number | null }[]> => []
  ),
  getSmartSeoulThemeApiKey: vi.fn(() => "TEST"),
}));
vi.mock("@features/places/data/smartSeoulThemeApi", () => ({
  getSmartSeoulThemeApiKey,
  fetchSmartSeoulThemePlaces: vi.fn(async () => []),
  getNearbySmartSeoulPlaces,
}));
const edition = "1786321258890";
const a = {
  id: `smart-seoul:${edition}:25_edition25_1`,
  name: "A",
  imageUrl: "",
  description: "",
  selectionYear: 2025,
  themeId: edition,
  themeName: "서울에디션25",
  markerColor: "blue",
  position: { lat: 37, lng: 127 },
  addedAt: "2026-01-01",
};
const b = {
  ...a,
  id: `smart-seoul:${edition}:26_edition25_1`,
  name: "B",
  selectionYear: 2026,
  position: { lat: 37.1, lng: 127.1 },
  addedAt: "2026-01-02",
};
afterEach(() => {
  cleanup();
  stampCourseStore.setState({ places: [] });
  unlockedLinkedPlaceStore.setState({ references: [] });
  localStorage.removeItem(UNLOCKED_LINKED_PLACE_STORAGE_KEY);
  vi.clearAllMocks();
  getNearbySmartSeoulPlaces.mockReset().mockResolvedValue([]);
  getSmartSeoulThemeApiKey.mockReturnValue("TEST");
});

test("only activates after adding an Edition, preserves selection, and reconciles removal", async () => {
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLinkedPlaceExploration([]), { wrapper });
  expect(result.current.selected).toBeNull();
  expect(getNearbySmartSeoulPlaces).not.toHaveBeenCalled();
  act(() => {
    expect(result.current.activate({ ...a, themeId: "100032" })).toBe(false);
  });
  expect(getNearbySmartSeoulPlaces).not.toHaveBeenCalled();
  act(() => {
    stampCourseStore.setState({ places: [b] });
    result.current.activate(b);
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.selected?.id).toBe(b.id);
  act(() => {
    stampCourseStore.setState({ places: [b, a] });
    result.current.select(a.id);
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.selected?.id).toBe(a.id);
  act(() => stampCourseStore.setState({ places: [b] }));
  expect(result.current.selected?.id).toBe(b.id);
  expect(getNearbySmartSeoulPlaces).toHaveBeenCalledTimes(2);
  act(() => stampCourseStore.setState({ places: [] }));
  expect(result.current.selected).toBeNull();
  expect(result.current.markers.features).toHaveLength(0);
  act(() => stampCourseStore.setState({ places: [a] }));
  expect(result.current.selected).toBeNull();
  client.clear();
});

test("missing API configuration shows an error instead of loading forever", () => {
  getSmartSeoulThemeApiKey.mockReturnValue("");
  stampCourseStore.setState({ places: [a] });
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLinkedPlaceExploration([]), { wrapper });
  act(() => {
    result.current.activate(a);
  });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isError).toBe(true);
  expect(getNearbySmartSeoulPlaces).not.toHaveBeenCalled();
  client.clear();
});

test("tab selection changes the list but keeps all unlocked markers after course removal", async () => {
  const linkedA: SmartSeoulThemePlace = {
    ...a,
    id: "linked-a",
    sourceContentId: "linked-a",
    themeId: "100032",
    districtName: "",
    address: "",
  };
  const linkedB = { ...linkedA, id: "linked-b", sourceContentId: "linked-b" };
  getNearbySmartSeoulPlaces
    .mockResolvedValueOnce([{ place: linkedA, distance: 100 }])
    .mockResolvedValueOnce([{ place: linkedB, distance: 200 }]);
  stampCourseStore.setState({ places: [a] });
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLinkedPlaceExploration([]), { wrapper });
  act(() => {
    result.current.activate(a);
  });
  await waitFor(() =>
    expect(result.current.markers.features.map((feature) => feature.id)).toEqual(["linked-a"])
  );
  act(() => {
    stampCourseStore.setState({ places: [a, b] });
    result.current.activate(b);
  });
  await waitFor(() =>
    expect(result.current.markers.features.map((feature) => feature.id)).toEqual([
      "linked-a",
      "linked-b",
    ])
  );
  expect(result.current.places.map((place) => place.id)).toEqual(["linked-b"]);
  act(() => result.current.select(a.id));
  await waitFor(() => expect(result.current.places.map((place) => place.id)).toEqual(["linked-a"]));
  expect(result.current.markers.features.map((feature) => feature.id)).toEqual([
    "linked-a",
    "linked-b",
  ]);
  expect(getNearbySmartSeoulPlaces).toHaveBeenCalledTimes(2);
  expect(stampCourseStore.getState().places.map((place) => place.id)).toEqual([a.id, b.id]);
  act(() => stampCourseStore.setState({ places: [] }));
  expect(result.current.selected).toBeNull();
  expect(result.current.markers.features.map((feature) => feature.id)).toEqual([
    "linked-a",
    "linked-b",
  ]);
  client.clear();
});

test("restores unlocked markers with a fresh query cache even after courses were deleted", async () => {
  const linked: SmartSeoulThemePlace = {
    ...a,
    id: "linked-a",
    sourceContentId: "linked-a",
    themeId: "100032",
    districtName: "",
    address: "",
  };
  getNearbySmartSeoulPlaces.mockResolvedValue([{ place: linked, distance: 100 }]);
  stampCourseStore.setState({ places: [a] });
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const first = renderHook(() => useLinkedPlaceExploration([]), { wrapper });
  await waitFor(() => expect(first.result.current.markers.features).toHaveLength(1));
  expect(first.result.current.selected?.id).toBe(a.id);
  first.unmount();
  client.clear();
  stampCourseStore.setState({ places: [] });
  unlockedLinkedPlaceStore.setState({
    references: createUnlockedLinkedPlaceStore().getState().references,
  });
  const freshClient = new QueryClient();
  const restored = renderHook(() => useLinkedPlaceExploration([]), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={freshClient}>{children}</QueryClientProvider>
    ),
  });
  await waitFor(() =>
    expect(restored.result.current.markers.features.map((feature) => feature.id)).toEqual([
      "linked-a",
    ])
  );
  expect(restored.result.current.selected).toBeNull();
  expect(getNearbySmartSeoulPlaces).toHaveBeenCalledTimes(2);
  restored.unmount();
  freshClient.clear();
});

test("overlapping results appear once on the map while each reference keeps its own list", async () => {
  const linked: SmartSeoulThemePlace = {
    ...a,
    id: "shared",
    sourceContentId: "shared",
    themeId: "100032",
    districtName: "",
    address: "",
  };
  getNearbySmartSeoulPlaces.mockResolvedValue([{ place: linked, distance: 100 }]);
  stampCourseStore.setState({ places: [a, b] });
  const client = new QueryClient();
  const view = renderHook(() => useLinkedPlaceExploration([]), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await waitFor(() =>
    expect(view.result.current.places.map((place) => place.id)).toEqual(["shared"])
  );
  expect(view.result.current.markers.features.map((feature) => feature.id)).toEqual(["shared"]);
  act(() => view.result.current.select(a.id));
  await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
  expect(view.result.current.places.map((place) => place.id)).toEqual(["shared"]);
  expect(view.result.current.markers.features).toHaveLength(1);
  expect(getNearbySmartSeoulPlaces).toHaveBeenCalledTimes(2);
  view.unmount();
  client.clear();
});

test("a failed request for the newly added reference does not remove previously unlocked markers", async () => {
  const linked: SmartSeoulThemePlace = {
    ...a,
    id: "linked-a",
    sourceContentId: "linked-a",
    themeId: "100032",
    districtName: "",
    address: "",
  };
  getNearbySmartSeoulPlaces
    .mockResolvedValueOnce([{ place: linked, distance: 100 }])
    .mockRejectedValue(new Error("offline"));
  stampCourseStore.setState({ places: [a] });
  const client = new QueryClient();
  const view = renderHook(() => useLinkedPlaceExploration([]), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  await waitFor(() => expect(view.result.current.markers.features).toHaveLength(1));
  act(() => {
    stampCourseStore.setState({ places: [a, b] });
    view.result.current.activate(b);
  });
  await waitFor(() => expect(view.result.current.isError).toBe(true));
  expect(view.result.current.markers.features.map((feature) => feature.id)).toEqual(["linked-a"]);
  expect(view.result.current.places).toEqual([]);
  view.unmount();
  client.clear();
});
