import type { SavedStampCoursePlace } from "@features/course";
import { SEOUL_EDITION25_THEME_ID, type SmartSeoulThemePlace } from "@features/places";
import type { LinkedPlaceReference } from "@features/exploration";

export function createLinkedPlaceReferences(
  savedPlaces: readonly SavedStampCoursePlace[],
  sourcePlaces: readonly SmartSeoulThemePlace[]
): LinkedPlaceReference[] {
  const sourceById = new Map(sourcePlaces.map((place) => [place.id, place]));
  return savedPlaces
    .filter((place) => place.themeId === SEOUL_EDITION25_THEME_ID)
    .map((place) => {
      const source = sourceById.get(place.id);
      const prefix = `smart-seoul:${SEOUL_EDITION25_THEME_ID}:`;
      const contentId = place.id.startsWith(prefix) ? place.id.slice(prefix.length) : "";
      const yearMatch = /^(\d{2})_edition25_\d+$/.exec(contentId);
      return {
        id: place.id,
        name: source?.name ?? place.name,
        imageUrl: source?.imageUrl || place.imageUrl,
        position: source?.position ?? place.position,
        addedAt: place.addedAt,
        selectionYear:
          source?.selectionYear ?? (yearMatch ? 2000 + Number(yearMatch[1]) : undefined),
      };
    });
}
