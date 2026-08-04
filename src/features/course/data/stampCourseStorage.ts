import { MAX_STAMP_COURSE_PLACES, type SavedStampCoursePlace } from "../domain/stampCourse";

export const STAMP_COURSE_STORAGE_KEY = "seoul-go:stamp-course:v1";
export const STAMP_COURSE_STORAGE_VERSION = 1;

export type StampCourseStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type PersistedStampCourse = {
  places: readonly SavedStampCoursePlace[];
  version: typeof STAMP_COURSE_STORAGE_VERSION;
};

export function loadStampCoursePlaces(
  storage: StampCourseStorage | null = getBrowserStorage()
): SavedStampCoursePlace[] {
  if (!storage) {
    return [];
  }

  const rawPayload = storage.getItem(STAMP_COURSE_STORAGE_KEY);

  if (!rawPayload) {
    return [];
  }

  try {
    const payload: unknown = JSON.parse(rawPayload);

    if (!isPersistedStampCourse(payload)) {
      return [];
    }

    return payload.places.filter(isSavedStampCoursePlace).slice(0, MAX_STAMP_COURSE_PLACES);
  } catch {
    return [];
  }
}

export function saveStampCoursePlaces(
  places: readonly SavedStampCoursePlace[],
  storage: StampCourseStorage | null = getBrowserStorage()
): void {
  if (!storage) {
    return;
  }

  const payload: PersistedStampCourse = {
    places,
    version: STAMP_COURSE_STORAGE_VERSION,
  };

  storage.setItem(STAMP_COURSE_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStampCoursePlaces(
  storage: StampCourseStorage | null = getBrowserStorage()
): void {
  storage?.removeItem(STAMP_COURSE_STORAGE_KEY);
}

function getBrowserStorage(): StampCourseStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function isPersistedStampCourse(value: unknown): value is PersistedStampCourse {
  return (
    isRecord(value) && value.version === STAMP_COURSE_STORAGE_VERSION && Array.isArray(value.places)
  );
}

function isSavedStampCoursePlace(value: unknown): value is SavedStampCoursePlace {
  if (!isRecord(value) || !isRecord(value.position)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.themeId === "string" &&
    value.themeId.trim().length > 0 &&
    typeof value.addedAt === "string" &&
    value.addedAt.trim().length > 0 &&
    isValidCoordinate(value.position.lat, -90, 90) &&
    isValidCoordinate(value.position.lng, -180, 180)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
