import { useCallback } from "react";

import { useStampCourseStore } from "@features/course";
import {
  createStampCoursePlaceInputFromSelection,
  type AddExplorationPlaceToCourseResultStatus,
  type ExplorationPlaceMarkerSelection,
} from "@features/exploration";

export function useAddExplorationPlaceToCourse(): (
  place: ExplorationPlaceMarkerSelection
) => AddExplorationPlaceToCourseResultStatus {
  const addPlace = useStampCourseStore((state) => state.addPlace);

  return useCallback(
    (place: ExplorationPlaceMarkerSelection) =>
      addPlace(createStampCoursePlaceInputFromSelection(place)).status,
    [addPlace]
  );
}
