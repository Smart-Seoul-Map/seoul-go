import { useCallback, useEffect, useMemo, useState } from "react";

import { useStampCourseStore } from "@features/course";
import {
  createPlacesFeatureCollection,
  SEOUL_EDITION25_THEME_ID,
  useLinkedPlacesQuery,
  useUnlockedLinkedPlacesQueries,
  type SmartSeoulThemePlace,
} from "@features/places";
import { resolveLinkedPlaceReference, useUnlockedLinkedPlaceStore } from "@features/exploration";
import { createLinkedPlaceReferences } from "./linkedPlaceReferences";
import type { ExplorationPlaceMarkerSelection, LinkedPlaceReference } from "@features/exploration";

const EMPTY_PLACES: SmartSeoulThemePlace[] = [];

export function useLinkedPlaceExploration(sourcePlaces: readonly SmartSeoulThemePlace[]) {
  const savedPlaces = useStampCourseStore((state) => state.places);
  const unlockedReferences = useUnlockedLinkedPlaceStore((state) => state.references);
  const unlockReferences = useUnlockedLinkedPlaceStore((state) => state.unlockReferences);
  const [visitedReference, setVisitedReference] = useState<LinkedPlaceReference | null>(null);
  const savedReferences = useMemo(
    () => createLinkedPlaceReferences(savedPlaces, sourcePlaces),
    [savedPlaces, sourcePlaces]
  );
  useEffect(() => {
    if (savedReferences.some(({ id }) => id === visitedReference?.id)) setVisitedReference(null);
  }, [savedReferences, visitedReference?.id]);
  const references = useMemo(() => {
    if (!visitedReference || savedReferences.some(({ id }) => id === visitedReference.id)) {
      return savedReferences;
    }

    return [...savedReferences, visitedReference];
  }, [savedReferences, visitedReference]);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => savedReferences.at(-1)?.id ?? null
  );
  useEffect(() => {
    // Saved courses also restore unlocks created before unlock history was introduced.
    unlockReferences(references);
  }, [references, unlockReferences]);
  const unlockedCenters = useMemo(
    () => unlockedReferences.map((reference) => reference.position),
    [unlockedReferences]
  );
  const mapPlaces = useUnlockedLinkedPlacesQueries(unlockedCenters);
  const selected = resolveLinkedPlaceReference(references, selectedId);
  const activeId = selected?.id ?? null;
  useEffect(() => {
    if (selectedId !== activeId) setSelectedId(activeId);
  }, [selectedId, activeId]);
  const query = useLinkedPlacesQuery(selected?.position ?? null);
  const places = useMemo(
    () => (query.isSuccess ? query.data.map((result) => result.place) : EMPTY_PLACES),
    [query.data, query.isSuccess]
  );
  const markers = useMemo(() => createPlacesFeatureCollection(mapPlaces), [mapPlaces]);
  const activate = useCallback((place: ExplorationPlaceMarkerSelection) => {
    if (place.themeId !== SEOUL_EDITION25_THEME_ID) return false;
    setVisitedReference({
      id: place.id,
      name: place.name,
      imageUrl: place.imageUrl,
      position: place.position,
      addedAt: new Date().toISOString(),
      selectionYear: place.selectionYear,
    });
    setSelectedId(place.id);
    return true;
  }, []);

  return {
    references,
    selected,
    places,
    markers,
    activate,
    select: setSelectedId,
    isLoading: selected !== null && query.isEnabled && query.isPending,
    isError: query.isError || (selected !== null && !query.isEnabled),
    isSuccess: selected !== null && query.isEnabled && query.isSuccess,
    retry: () => {
      void query.refetch();
    },
  };
}
