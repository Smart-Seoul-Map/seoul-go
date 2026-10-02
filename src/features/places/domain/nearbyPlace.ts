import type { SmartSeoulThemePlace } from "./place";

export type NearbySmartSeoulPlace = {
  place: SmartSeoulThemePlace;
  // Server-provided sort value, not a distance in meters.
  distance: number | null;
};

export function sortNearbyPlaces(
  results: readonly NearbySmartSeoulPlace[]
): NearbySmartSeoulPlace[] {
  const unique = new Map<string, NearbySmartSeoulPlace>();
  for (const result of results) {
    const existing = unique.get(result.place.id);
    if (!existing || (result.distance ?? Infinity) < (existing.distance ?? Infinity))
      unique.set(result.place.id, result);
  }
  return [...unique.values()].sort(
    (a, b) =>
      (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.place.id.localeCompare(b.place.id)
  );
}
