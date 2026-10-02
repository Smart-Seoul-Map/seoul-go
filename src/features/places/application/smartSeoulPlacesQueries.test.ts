import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SEOUL_EDITION25_THEME_ID, SMART_SEOUL_PLACE_THEME_IDS } from "../config/placeThemeConfig";
import { fetchSmartSeoulThemePlaces, getNearbySmartSeoulPlaces } from "../data/smartSeoulThemeApi";
import {
  seoulEditionPlacesOptions,
  nearbyThemePlacesOptions,
  linkedPlacesOptions,
} from "./smartSeoulPlacesQueries";

vi.mock("../data/smartSeoulThemeApi", () => ({
  getSmartSeoulThemeApiKey: () => "TEST",
  fetchSmartSeoulThemePlaces: vi.fn(async () => []),
  getNearbySmartSeoulPlaces: vi.fn(async () => []),
}));

const area = { center: { lat: 37.54, lng: 126.98 }, distanceMeters: 1000 };
beforeEach(() => vi.clearAllMocks());

describe("purpose-specific place queries", () => {
  test("fetches only the Edition catalog and reuses fresh results", async () => {
    const client = new QueryClient();
    await client.fetchQuery(seoulEditionPlacesOptions());
    await client.fetchQuery(seoulEditionPlacesOptions());
    expect(fetchSmartSeoulThemePlaces).toHaveBeenCalledTimes(1);
    expect(fetchSmartSeoulThemePlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        themeIds: [SEOUL_EDITION25_THEME_ID],
        signal: expect.any(AbortSignal),
      })
    );
    expect(seoulEditionPlacesOptions().retry).toBe(false);
    expect(seoulEditionPlacesOptions().gcTime).toBeGreaterThanOrEqual(30 * 60 * 1000);
    client.clear();
  });
  test("keeps station availability on all six themes", async () => {
    const client = new QueryClient();
    await client.fetchQuery(nearbyThemePlacesOptions(area));
    expect(fetchSmartSeoulThemePlaces).toHaveBeenCalledWith(
      expect.objectContaining({ themeIds: SMART_SEOUL_PLACE_THEME_IDS, searchArea: area })
    );
    client.clear();
  });
  test("queries linked themes only and separates centers in cache", async () => {
    const client = new QueryClient();
    await client.fetchQuery(linkedPlacesOptions(area.center));
    await client.fetchQuery(linkedPlacesOptions({ ...area.center, lng: 127 }));
    expect(getNearbySmartSeoulPlaces).toHaveBeenCalledTimes(2);
    expect(getNearbySmartSeoulPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        themeIds: SMART_SEOUL_PLACE_THEME_IDS.filter((id) => id !== SEOUL_EDITION25_THEME_ID),
        searchArea: area,
      })
    );
    expect(linkedPlacesOptions(null).enabled).toBe(false);
    client.clear();
  });
});
