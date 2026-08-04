export const MAX_STAMP_COURSE_PLACES = 6;

export type StampCoursePlacePosition = {
  lat: number;
  lng: number;
};

export type StampCoursePlaceInput = {
  id: string;
  name: string;
  position: StampCoursePlacePosition;
  themeId: string;
};

export type SavedStampCoursePlace = StampCoursePlaceInput & {
  addedAt: string;
};

export type RemovedStampCoursePlace = {
  index: number;
  place: SavedStampCoursePlace;
};

export type AddStampCoursePlaceResult =
  | {
      places: SavedStampCoursePlace[];
      status: "added";
    }
  | {
      places: readonly SavedStampCoursePlace[];
      status: "duplicate" | "full" | "invalid-place";
    };

export type RemoveStampCoursePlaceResult =
  | {
      places: SavedStampCoursePlace[];
      removedPlace: RemovedStampCoursePlace;
      status: "removed";
    }
  | {
      places: readonly SavedStampCoursePlace[];
      removedPlace: null;
      status: "not-found";
    };

export type RestoreRemovedStampCoursePlaceResult =
  | {
      places: SavedStampCoursePlace[];
      status: "restored";
    }
  | {
      places: readonly SavedStampCoursePlace[];
      status: "skipped";
    };

export type ReorderStampCoursePlacesResult =
  | {
      places: SavedStampCoursePlace[];
      status: "reordered";
    }
  | {
      places: readonly SavedStampCoursePlace[];
      status: "skipped";
    };

export type AddStampCoursePlaceOptions = {
  addedAt: string;
};

export type ReorderStampCoursePlacesOptions = {
  fromIndex: number;
  toIndex: number;
};

export function addStampCoursePlace(
  places: readonly SavedStampCoursePlace[],
  place: StampCoursePlaceInput,
  { addedAt }: AddStampCoursePlaceOptions
): AddStampCoursePlaceResult {
  if (!isValidStampCoursePlaceInput(place) || !addedAt) {
    return { places, status: "invalid-place" };
  }

  if (places.some((savedPlace) => savedPlace.id === place.id)) {
    return { places, status: "duplicate" };
  }

  if (places.length >= MAX_STAMP_COURSE_PLACES) {
    return { places, status: "full" };
  }

  return {
    places: [
      ...places,
      {
        ...place,
        addedAt,
        position: { ...place.position },
      },
    ],
    status: "added",
  };
}

export function removeStampCoursePlace(
  places: readonly SavedStampCoursePlace[],
  placeId: string
): RemoveStampCoursePlaceResult {
  const targetIndex = places.findIndex((place) => place.id === placeId);

  if (targetIndex === -1) {
    return { places, removedPlace: null, status: "not-found" };
  }

  return {
    places: places.filter((_, index) => index !== targetIndex),
    removedPlace: {
      index: targetIndex,
      place: places[targetIndex],
    },
    status: "removed",
  };
}

export function restoreRemovedStampCoursePlace(
  places: readonly SavedStampCoursePlace[],
  removedPlace: RemovedStampCoursePlace
): RestoreRemovedStampCoursePlaceResult {
  if (
    places.length >= MAX_STAMP_COURSE_PLACES ||
    places.some((place) => place.id === removedPlace.place.id)
  ) {
    return { places, status: "skipped" };
  }

  const nextPlaces = [...places];
  const restoreIndex = clamp(removedPlace.index, 0, nextPlaces.length);
  nextPlaces.splice(restoreIndex, 0, removedPlace.place);

  return {
    places: nextPlaces,
    status: "restored",
  };
}

export function reorderStampCoursePlaces(
  places: readonly SavedStampCoursePlace[],
  { fromIndex, toIndex }: ReorderStampCoursePlacesOptions
): ReorderStampCoursePlacesResult {
  if (
    fromIndex === toIndex ||
    !isFilledPlaceIndex(places, fromIndex) ||
    !isFilledPlaceIndex(places, toIndex)
  ) {
    return { places, status: "skipped" };
  }

  const nextPlaces = [...places];
  const [movedPlace] = nextPlaces.splice(fromIndex, 1);
  nextPlaces.splice(toIndex, 0, movedPlace);

  return {
    places: nextPlaces,
    status: "reordered",
  };
}

function isValidStampCoursePlaceInput(place: StampCoursePlaceInput): boolean {
  return (
    place.id.trim().length > 0 &&
    place.name.trim().length > 0 &&
    place.themeId.trim().length > 0 &&
    isValidCoordinate(place.position)
  );
}

function isValidCoordinate({ lat, lng }: StampCoursePlacePosition): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function isFilledPlaceIndex(places: readonly SavedStampCoursePlace[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < places.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
