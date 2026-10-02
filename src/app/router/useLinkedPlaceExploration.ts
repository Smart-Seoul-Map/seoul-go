import { useCallback, useEffect, useMemo, useState } from "react";

import { useStampCourseStore } from "@features/course";
import {
  createPlacesFeatureCollection,
  SEOUL_EDITION25_THEME_ID,
  useLinkedPlacesQuery,
  type SmartSeoulThemePlace,
} from "@features/places";
import { resolveLinkedPlaceReference } from "@features/exploration";
import { createLinkedPlaceReferences } from "./linkedPlaceReferences";
import type { ExplorationPlaceMarkerSelection } from "@features/exploration";

const EMPTY_PLACES: SmartSeoulThemePlace[] = [];

export function useLinkedPlaceExploration(sourcePlaces: readonly SmartSeoulThemePlace[]) {
  const savedPlaces = useStampCourseStore((state) => state.places);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const references = useMemo(
    () => createLinkedPlaceReferences(savedPlaces, sourcePlaces),
    [savedPlaces, sourcePlaces]
  );
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
  const markers = useMemo(() => createPlacesFeatureCollection(places), [places]);
  const activate = useCallback((place: ExplorationPlaceMarkerSelection) => {
    if (place.themeId !== SEOUL_EDITION25_THEME_ID) return false;
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
