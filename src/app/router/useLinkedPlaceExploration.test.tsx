import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { stampCourseStore } from "@features/course";
import { useLinkedPlaceExploration } from "./useLinkedPlaceExploration";

const { getNearbySmartSeoulPlaces, getSmartSeoulThemeApiKey } = vi.hoisted(() => ({
  getNearbySmartSeoulPlaces: vi.fn(async () => []),
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
  vi.clearAllMocks();
  getSmartSeoulThemeApiKey.mockReturnValue("TEST");
});

test("only activates after adding an Edition, preserves selection, and reconciles removal", async () => {
  stampCourseStore.setState({ places: [a, b] });
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
    result.current.activate(b);
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.selected?.id).toBe(b.id);
  act(() => result.current.select(a.id));
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
