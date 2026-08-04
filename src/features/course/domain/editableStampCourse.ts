import type { SavedStampCoursePlace } from "./stampCourse";

export type EditableStampCourse = {
  originalPlaces: SavedStampCoursePlace[];
  places: SavedStampCoursePlace[];
};

export function createEditableStampCourse(
  places: readonly SavedStampCoursePlace[]
): EditableStampCourse {
  return {
    originalPlaces: copyStampCoursePlaces(places),
    places: copyStampCoursePlaces(places),
  };
}

export function hasEditableStampCourseChanges({
  originalPlaces,
  places,
}: EditableStampCourse): boolean {
  return (
    originalPlaces.length !== places.length ||
    originalPlaces.some((place, index) => place.id !== places[index]?.id)
  );
}

export function resetEditableStampCourse({
  originalPlaces,
}: EditableStampCourse): EditableStampCourse {
  return {
    originalPlaces: copyStampCoursePlaces(originalPlaces),
    places: copyStampCoursePlaces(originalPlaces),
  };
}

function copyStampCoursePlaces(places: readonly SavedStampCoursePlace[]): SavedStampCoursePlace[] {
  return places.map((place) => ({
    ...place,
    position: { ...place.position },
  }));
}
