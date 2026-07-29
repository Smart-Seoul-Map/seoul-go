import type { SmartSeoulThemePlace } from "../domain/place";

export function filterSmartSeoulPlacesByDistrict(
  places: readonly SmartSeoulThemePlace[],
  districtName?: string
): SmartSeoulThemePlace[] {
  if (!districtName) {
    return [...places];
  }

  return places.filter((place) => place.districtName === districtName);
}
