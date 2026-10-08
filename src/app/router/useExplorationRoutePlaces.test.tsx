import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { useSeoulEditionPlacesQuery, type SmartSeoulThemePlace } from "@features/places";
import { useDistrictExplorationRoutePlaces } from "./useExplorationRoutePlaces";

const edition = "1786321258890";
const place: SmartSeoulThemePlace = {
  id: `smart-seoul:${edition}:25_edition25_1`,
  sourceContentId: "25_edition25_1",
  name: "A",
  districtName: "중구",
  address: "서울특별시 중구",
  imageUrl: "",
  description: "",
  selectionYear: 2025,
  themeId: edition,
  themeName: "서울에디션25",
  position: { lat: 37, lng: 127 },
};

const { fetchSmartSeoulThemePlaces } = vi.hoisted(() => ({
  fetchSmartSeoulThemePlaces: vi.fn(async (): Promise<SmartSeoulThemePlace[]> => []),
}));
vi.mock("@features/places/data/smartSeoulThemeApi", () => ({
  getSmartSeoulThemeApiKey: () => "TEST",
  fetchSmartSeoulThemePlaces,
  getNearbySmartSeoulPlaces: vi.fn(async () => []),
}));

afterEach(() => {
  cleanup();
  fetchSmartSeoulThemePlaces.mockReset().mockResolvedValue([]);
});

test("main map reuses the Seoul Edition list cached by the intro without refetching", async () => {
  fetchSmartSeoulThemePlaces.mockResolvedValue([place]);
  const client = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const intro = renderHook(() => useSeoulEditionPlacesQuery(), { wrapper });
  await waitFor(() => expect(intro.result.current.isSuccess).toBe(true));
  expect(fetchSmartSeoulThemePlaces).toHaveBeenCalledTimes(1);
  intro.unmount();

  const mainMap = renderHook(() => useDistrictExplorationRoutePlaces(null), { wrapper });
  expect(mainMap.result.current.isSuccess).toBe(true);
  expect(mainMap.result.current.isLoading).toBe(false);
  expect(mainMap.result.current.places).toEqual([place]);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(client.isFetching()).toBe(0);
  expect(fetchSmartSeoulThemePlaces).toHaveBeenCalledTimes(1);
  client.clear();
});
