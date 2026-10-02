import { useEffect, useRef, useState } from "react";

import {
  loadPreviousEntryEditionIds,
  savePreviousEntryEditionIds,
} from "../data/entryEditionSelectionStorage";
import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { selectEntryEditionPlaces } from "../domain/selectEntryEditionPlaces";

export function useEntryEditionSelection(source: readonly EntryEditionPlace[] | undefined) {
  const selectedRef = useRef<readonly EntryEditionPlace[] | null>(null);
  const [places, setPlaces] = useState<readonly EntryEditionPlace[] | null>(null);

  useEffect(() => {
    if (!source?.length || selectedRef.current) return;
    const selected = selectEntryEditionPlaces(source, loadPreviousEntryEditionIds());
    selectedRef.current = selected;
    savePreviousEntryEditionIds(selected.map((place) => place.id));
    setPlaces(selected);
  }, [source]);

  return places;
}
