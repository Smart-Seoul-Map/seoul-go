export const placesQueryKeys = {
  all: ["places"] as const,
  smartSeoulThemePlaces: (themeIds: readonly string[]) =>
    [...placesQueryKeys.all, "smartSeoulThemePlaces", [...themeIds]] as const,
};
