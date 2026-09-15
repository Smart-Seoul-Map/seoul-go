import type { ReactElement } from "react";

import { useStampCourseStore } from "@features/course";
import type { ExplorationPlacePanelProps } from "@features/exploration";
import { MapPlaceDetailPanel } from "@features/places";

export function ExplorationPlacePanel({
  place,
  onAddToCourse,
  onClose,
}: ExplorationPlacePanelProps): ReactElement {
  const isStampAcquired = useStampCourseStore((state) =>
    state.places.some((savedPlace) => savedPlace.id === place.id)
  );

  return (
    <MapPlaceDetailPanel
      isStampAcquired={isStampAcquired}
      place={{
        title: place.name,
        image: { src: place.imageUrl, alt: `${place.name} 대표 이미지` },
      }}
      onAddToCourse={onAddToCourse ? () => onAddToCourse(place) : undefined}
      onClose={onClose}
    />
  );
}
