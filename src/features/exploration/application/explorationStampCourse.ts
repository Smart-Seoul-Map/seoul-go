import type { AppToastOptions } from "@shared/ui/toast";

import type { ExplorationPlaceMarkerSelection } from "./explorationPlaceMarkers";

export type AddExplorationPlaceToCourseResultStatus =
  "added" | "duplicate" | "full" | "invalid-place";

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
): Pick<AppToastOptions, "durationMs" | "message" | "status"> {
  const durationMs = 2000;

  if (status === "added") {
    return {
      durationMs,
      message: "스탬프 코스에 담았어요",
      status: "success",
    };
  }

  if (status === "duplicate") {
    return {
      durationMs,
      message: "이미 담긴 장소예요",
      status: "info",
    };
  }

  if (status === "full") {
    return {
      durationMs,
      message: "스탬프 코스는 최대 6개까지 담을 수 있어요",
      status: "error",
    };
  }

  return {
    durationMs,
    message: "장소 정보를 확인할 수 없어요",
    status: "error",
  };
}
