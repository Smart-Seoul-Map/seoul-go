import { createStore } from "zustand/vanilla";

import {
  clearVisitedPlaceIds,
  loadVisitedPlaceIds,
  saveVisitedPlaceIds,
  type VisitedPlaceStorage,
} from "../data/visitedPlaceStorage";

export type VisitPlaceResult =
  | {
      placeIds: string[];
      status: "visited";
    }
  | {
      placeIds: string[];
      status: "already-visited" | "invalid-place";
    };

export type VisitedPlaceStoreState = {
  clearVisitedPlaces: () => void;
  placeIds: string[];
  visitPlace: (placeId: string) => VisitPlaceResult;
};

export type CreateVisitedPlaceStoreOptions = {
  storage?: VisitedPlaceStorage | null;
};

export function createVisitedPlaceStore({ storage }: CreateVisitedPlaceStoreOptions = {}) {
  const loadPlaceIds = () =>
    storage === undefined ? loadVisitedPlaceIds() : loadVisitedPlaceIds(storage);
  const savePlaceIds = (placeIds: readonly string[]) => {
    if (storage === undefined) {
      saveVisitedPlaceIds(placeIds);
      return;
    }

    saveVisitedPlaceIds(placeIds, storage);
  };
  const clearSavedPlaceIds = () => {
    if (storage === undefined) {
      clearVisitedPlaceIds();
      return;
    }

    clearVisitedPlaceIds(storage);
  };

  return createStore<VisitedPlaceStoreState>()((set, get) => ({
    clearVisitedPlaces: () => {
      set({ placeIds: [] });
      clearSavedPlaceIds();
    },
    placeIds: loadPlaceIds(),
    visitPlace: (placeId) => {
      if (placeId.trim().length === 0) {
        return {
          placeIds: get().placeIds,
          status: "invalid-place",
        };
      }

      if (get().placeIds.includes(placeId)) {
        return {
          placeIds: get().placeIds,
          status: "already-visited",
        };
      }

      const placeIds = [...get().placeIds, placeId];

      set({ placeIds });
      savePlaceIds(placeIds);

      return {
        placeIds,
        status: "visited",
      };
    },
  }));
}
