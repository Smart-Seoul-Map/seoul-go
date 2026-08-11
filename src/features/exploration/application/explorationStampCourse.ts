import type { ExplorationPlaceMarkerSelection } from "./explorationPlaceMarkers";

const STAMP_COURSE_TOAST_DURATION_MS = 2000;

export type AddExplorationPlaceToCourseResultStatus =
  "added" | "duplicate" | "full" | "invalid-place";

export type ExplorationStampCourseToastMessage = {
  durationMs: number;
  message: string;
  status: "error" | "info" | "success";
};

export type ExplorationStampCoursePlaceInput = {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  themeId: string;
};

export function createStampCoursePlaceInputFromSelection(
  place: ExplorationPlaceMarkerSelection
): ExplorationStampCoursePlaceInput {
  return {
    id: place.id,
    name: place.name,
    position: { ...place.position },
    themeId: place.themeId,
  };
}

export function createStampCourseToastMessage(
  status: AddExplorationPlaceToCourseResultStatus
): ExplorationStampCourseToastMessage {
  if (status === "added") {
    return {
      durationMs: STAMP_COURSE_TOAST_DURATION_MS,
      message: "스탬프 코스에 담았어요",
      status: "success",
    };
  }

  if (status === "duplicate") {
    return {
      durationMs: STAMP_COURSE_TOAST_DURATION_MS,
      message: "이미 담긴 장소예요",
      status: "info",
    };
  }

  if (status === "full") {
    return {
      durationMs: STAMP_COURSE_TOAST_DURATION_MS,
      message: "스탬프 코스는 최대 6개까지 담을 수 있어요",
      status: "error",
    };
  }

  return {
    durationMs: STAMP_COURSE_TOAST_DURATION_MS,
    message: "장소 정보를 확인할 수 없어요",
    status: "error",
  };
}
