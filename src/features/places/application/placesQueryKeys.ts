import type { SmartSeoulThemeContentsSearchArea } from "../data/smartSeoulThemeApi";

export type NearbySmartSeoulThemePlacesQueryKeyParams = SmartSeoulThemeContentsSearchArea & {
  themeIds: readonly string[];
};

export const placesQueryKeys = {
  all: ["places"] as const,
  smartSeoulThemePlaces: (themeIds: readonly string[]) =>
    [...placesQueryKeys.all, "smartSeoulThemePlaces", [...themeIds]] as const,
  nearbySmartSeoulThemePlaces: ({
    center,
    distanceMeters,
    themeIds,
  }: NearbySmartSeoulThemePlacesQueryKeyParams) =>
    [
      ...placesQueryKeys.all,
      "nearbySmartSeoulThemePlaces",
      [...themeIds],
      center.lng,
      center.lat,
      distanceMeters,
    ] as const,
};
