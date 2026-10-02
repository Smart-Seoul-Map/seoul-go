import type { Coordinates } from "./explorationGeo";

type SavedReferencePlace = {
  id: string;
  name: string;
  imageUrl?: string;
  themeId: string;
  position: Coordinates;
  addedAt: string;
};

export type LinkedPlaceReference = Omit<SavedReferencePlace, "themeId"> & {
  selectionYear?: number;
};

export type UnlockedLinkedPlaceReference = Pick<LinkedPlaceReference, "id" | "position">;

export function resolveLinkedPlaceReference(
  references: readonly LinkedPlaceReference[],
  selectedId: string | null
): LinkedPlaceReference | null {
  if (selectedId === null) return null;
  const selected = references.find((place) => place.id === selectedId);
  if (selected) return selected;
  return references.reduce<LinkedPlaceReference | null>(
    (latest, place) => (!latest || place.addedAt > latest.addedAt ? place : latest),
    null
  );
}
