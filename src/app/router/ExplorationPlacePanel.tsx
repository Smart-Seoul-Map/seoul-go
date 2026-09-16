import type { ReactElement } from "react";

import { StampCourseSummary, useStampCourseStore } from "@features/course";
import type { ExplorationPlacePanelProps } from "@features/exploration";
import { MapPlaceDetailPanel, SEOUL_EDITION25_THEME_ID } from "@features/places";

export function ExplorationPlacePanel({
  place,
  onAddToCourse,
  onClose,
  onOpenCourse,
  open,
  onExitComplete,
  returnFocus,
}: ExplorationPlacePanelProps): ReactElement {
  const isStampAcquired = useStampCourseStore((state) =>
    state.places.some((savedPlace) => savedPlace.id === place.id)
  );

  return (
    <MapPlaceDetailPanel
      open={open}
      onExitComplete={onExitComplete}
      returnFocus={returnFocus}
      isStampAcquired={isStampAcquired}
      mobileAboveContent={<StampCourseSummary onOpen={onOpenCourse} />}
      place={{
        title: place.name,
        description:
          place.themeId === SEOUL_EDITION25_THEME_ID ? (place.description ?? "") : undefined,
        selectionYear: place.selectionYear,
        image: { src: place.imageUrl, alt: `${place.name} 대표 이미지` },
      }}
      onAddToCourse={onAddToCourse ? () => onAddToCourse(place) : undefined}
      onClose={onClose}
    />
  );
}
