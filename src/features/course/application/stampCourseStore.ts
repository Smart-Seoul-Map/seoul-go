import { createStore } from "zustand/vanilla";

import {
  clearStampCoursePlaces,
  loadStampCoursePlaces,
  saveStampCoursePlaces,
  type StampCourseStorage,
} from "../data/stampCourseStorage";
import {
  addStampCoursePlace,
  removeStampCoursePlace,
  reorderStampCoursePlaces,
  restoreRemovedStampCoursePlace,
  type AddStampCoursePlaceResult,
  type RemovedStampCoursePlace,
  type RemoveStampCoursePlaceResult,
  type ReorderStampCoursePlacesOptions,
  type ReorderStampCoursePlacesResult,
  type RestoreRemovedStampCoursePlaceResult,
  type SavedStampCoursePlace,
  type StampCoursePlaceInput,
} from "../domain/stampCourse";

export type AddStampCoursePlaceToStoreOptions = {
  addedAt?: string;
};

export type StampCourseStoreState = {
  addPlace: (
    place: StampCoursePlaceInput,
    options?: AddStampCoursePlaceToStoreOptions
  ) => AddStampCoursePlaceResult;
  clearPlaces: () => void;
  places: SavedStampCoursePlace[];
  removePlace: (placeId: string) => RemoveStampCoursePlaceResult;
  reorderPlaces: (options: ReorderStampCoursePlacesOptions) => ReorderStampCoursePlacesResult;
  restoreRemovedPlace: (
    removedPlace: RemovedStampCoursePlace
  ) => RestoreRemovedStampCoursePlaceResult;
};

export type CreateStampCourseStoreOptions = {
  now?: () => string;
  storage?: StampCourseStorage | null;
};

export function createStampCourseStore({
  now = () => new Date().toISOString(),
  storage,
}: CreateStampCourseStoreOptions = {}) {
  const loadPlaces = () =>
    storage === undefined ? loadStampCoursePlaces() : loadStampCoursePlaces(storage);
  const savePlaces = (places: readonly SavedStampCoursePlace[]) => {
    if (storage === undefined) {
      saveStampCoursePlaces(places);
      return;
    }

    saveStampCoursePlaces(places, storage);
  };
  const clearSavedPlaces = () => {
    if (storage === undefined) {
      clearStampCoursePlaces();
      return;
    }

    clearStampCoursePlaces(storage);
  };

  return createStore<StampCourseStoreState>()((set, get) => ({
    addPlace: (place, options) => {
      const result = addStampCoursePlace(get().places, place, {
        addedAt: options?.addedAt ?? now(),
      });

      if (result.status === "added") {
        set({ places: result.places });
        savePlaces(result.places);
      }

      return result;
    },
    clearPlaces: () => {
      set({ places: [] });
      clearSavedPlaces();
    },
    places: loadPlaces(),
    removePlace: (placeId) => {
      const result = removeStampCoursePlace(get().places, placeId);

      if (result.status === "removed") {
        set({ places: result.places });
        savePlaces(result.places);
      }

      return result;
    },
    reorderPlaces: (options) => {
      const result = reorderStampCoursePlaces(get().places, options);

      if (result.status === "reordered") {
        set({ places: result.places });
        savePlaces(result.places);
      }

      return result;
    },
    restoreRemovedPlace: (removedPlace) => {
      const result = restoreRemovedStampCoursePlace(get().places, removedPlace);

      if (result.status === "restored") {
        set({ places: result.places });
        savePlaces(result.places);
      }

      return result;
    },
  }));
}
