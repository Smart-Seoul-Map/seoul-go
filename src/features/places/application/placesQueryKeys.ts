import type { SmartSeoulThemeContentsSearchArea } from "../data/smartSeoulThemeApi";

export type LinkedThemePlacesQueryKeyParams = SmartSeoulThemeContentsSearchArea & {
  themeId: string;
};

export const placesQueryKeys = {
  all: ["places"] as const,
  smartSeoulThemePlaces: (themeIds: readonly string[]) =>
    [...placesQueryKeys.all, "smartSeoulThemePlaces", [...themeIds]] as const,
  linkedPlaces: ({ center, distanceMeters, themeId }: LinkedThemePlacesQueryKeyParams) =>
    [
      ...placesQueryKeys.all,
      "linkedPlaces",
      themeId,
      center.lng,
      center.lat,
      distanceMeters,
    ] as const,
};
