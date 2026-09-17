import type { SavedStampCoursePlace } from "../domain/stampCourse";

const STAMP_COURSE_CAPTURE_SEAL_SIZE = 384;
const STAMP_COURSE_CAPTURE_IMAGE_TYPE = "image/jpeg";
const STAMP_COURSE_CAPTURE_IMAGE_QUALITY = 0.85;

function loadCrossOriginImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function createSquareThumbnail(image: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  canvas.width = STAMP_COURSE_CAPTURE_SEAL_SIZE;
  canvas.height = STAMP_COURSE_CAPTURE_SEAL_SIZE;

  const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
  const cropX = (image.naturalWidth - cropSize) / 2;
  const cropY = (image.naturalHeight - cropSize) / 2;

  context.drawImage(
    image,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    STAMP_COURSE_CAPTURE_SEAL_SIZE,
    STAMP_COURSE_CAPTURE_SEAL_SIZE
  );

  try {
    return canvas.toDataURL(STAMP_COURSE_CAPTURE_IMAGE_TYPE, STAMP_COURSE_CAPTURE_IMAGE_QUALITY);
  } catch {
    return null;
  }
}

async function createCapturePlace(place: SavedStampCoursePlace): Promise<SavedStampCoursePlace> {
  if (!place.imageUrl) {
    return place;
  }

  const image = await loadCrossOriginImage(place.imageUrl);
  const thumbnail = image ? createSquareThumbnail(image) : null;

  return { ...place, imageUrl: thumbnail ?? undefined };
}

export function createStampCourseCapturePlaces(
  places: readonly SavedStampCoursePlace[]
): Promise<SavedStampCoursePlace[]> {
  return Promise.all(places.map(createCapturePlace));
}
