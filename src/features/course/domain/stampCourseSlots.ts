import { MAX_STAMP_COURSE_PLACES, type SavedStampCoursePlace } from "./stampCourse";

export type FilledStampCourseSlot = {
  index: number;
  place: SavedStampCoursePlace;
  status: "filled";
};

export type EmptyStampCourseSlot = {
  index: number;
  place: null;
  status: "empty";
};

export type StampCourseSlot = FilledStampCourseSlot | EmptyStampCourseSlot;

export function createStampCourseSlots(
  places: readonly SavedStampCoursePlace[]
): StampCourseSlot[] {
  return Array.from({ length: MAX_STAMP_COURSE_PLACES }, (_, index) => {
    const place = places[index];

    if (place) {
      return {
        index,
        place,
        status: "filled",
      };
    }

    return {
      index,
      place: null,
      status: "empty",
    };
  });
}
