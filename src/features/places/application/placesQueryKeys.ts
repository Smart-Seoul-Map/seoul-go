export const placesQueryKeys = {
  all: ["places"] as const,
  smartSeoulThemePlaces: (themeIds: readonly string[], districtName?: string) =>
    [...placesQueryKeys.all, "smartSeoulThemePlaces", [...themeIds], districtName ?? null] as const,
};
