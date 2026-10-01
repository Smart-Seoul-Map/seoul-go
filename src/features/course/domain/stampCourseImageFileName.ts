const STAMP_COURSE_IMAGE_FILE_PREFIX = "seoul-go-stamp-course";
const STAMP_COURSE_IMAGE_FILE_EXTENSION = "png";

function padStart(value: number): string {
  return String(value).padStart(2, "0");
}

export function createStampCourseImageFileName(savedAt: Date): string {
  const savedDate = [
    savedAt.getFullYear(),
    padStart(savedAt.getMonth() + 1),
    padStart(savedAt.getDate()),
  ].join("");

  return `${STAMP_COURSE_IMAGE_FILE_PREFIX}-${savedDate}.${STAMP_COURSE_IMAGE_FILE_EXTENSION}`;
}
