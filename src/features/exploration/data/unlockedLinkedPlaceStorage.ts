import type { UnlockedLinkedPlaceReference } from "../domain/linkedPlaceReference";

export const UNLOCKED_LINKED_PLACE_STORAGE_KEY = "seoul-go:unlocked-linked-places:v1";
export type UnlockedLinkedPlaceStorage = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): UnlockedLinkedPlaceStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isReference(value: unknown): value is UnlockedLinkedPlaceReference {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim()) return false;
  if (!isRecord(value.position)) return false;
  const { lat, lng } = value.position;
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180
  );
}

export function loadUnlockedLinkedPlaces(
  storage: UnlockedLinkedPlaceStorage | null = getBrowserStorage()
): UnlockedLinkedPlaceReference[] {
  try {
    const payload: unknown = JSON.parse(
      storage?.getItem(UNLOCKED_LINKED_PLACE_STORAGE_KEY) ?? "null"
    );
    if (!isRecord(payload) || payload.version !== 1 || !Array.isArray(payload.references))
      return [];
    const references = payload.references.filter(isReference).map(({ id, position }) => ({
      id,
      position: { lat: position.lat, lng: position.lng },
    }));
    return Array.from(new Map(references.map((reference) => [reference.id, reference])).values());
  } catch {
    return [];
  }
}

export function saveUnlockedLinkedPlaces(
  references: readonly UnlockedLinkedPlaceReference[],
  storage: UnlockedLinkedPlaceStorage | null = getBrowserStorage()
): void {
  try {
    storage?.setItem(UNLOCKED_LINKED_PLACE_STORAGE_KEY, JSON.stringify({ version: 1, references }));
  } catch {
    // Storage may be disabled or full; unlocks still work for the current session.
  }
}
