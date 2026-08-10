export const VISITED_PLACE_STORAGE_KEY = "seoul-go:visited-places:v1";
export const VISITED_PLACE_STORAGE_VERSION = 1;

export type VisitedPlaceStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type PersistedVisitedPlaces = {
  placeIds: readonly string[];
  version: typeof VISITED_PLACE_STORAGE_VERSION;
};

export function loadVisitedPlaceIds(
  storage: VisitedPlaceStorage | null = getBrowserStorage()
): string[] {
  if (!storage) {
    return [];
  }

  const rawPayload = storage.getItem(VISITED_PLACE_STORAGE_KEY);

  if (!rawPayload) {
    return [];
  }

  try {
    const payload: unknown = JSON.parse(rawPayload);

    if (!isPersistedVisitedPlaces(payload)) {
      return [];
    }

    return Array.from(new Set(payload.placeIds.filter(isValidPlaceId)));
  } catch {
    return [];
  }
}

export function saveVisitedPlaceIds(
  placeIds: readonly string[],
  storage: VisitedPlaceStorage | null = getBrowserStorage()
): void {
  if (!storage) {
    return;
  }

  const payload: PersistedVisitedPlaces = {
    placeIds: Array.from(new Set(placeIds.filter(isValidPlaceId))),
    version: VISITED_PLACE_STORAGE_VERSION,
  };

  storage.setItem(VISITED_PLACE_STORAGE_KEY, JSON.stringify(payload));
}

export function clearVisitedPlaceIds(
  storage: VisitedPlaceStorage | null = getBrowserStorage()
): void {
  storage?.removeItem(VISITED_PLACE_STORAGE_KEY);
}

function getBrowserStorage(): VisitedPlaceStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isPersistedVisitedPlaces(value: unknown): value is PersistedVisitedPlaces {
  return (
    isRecord(value) &&
    value.version === VISITED_PLACE_STORAGE_VERSION &&
    Array.isArray(value.placeIds)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isValidPlaceId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
