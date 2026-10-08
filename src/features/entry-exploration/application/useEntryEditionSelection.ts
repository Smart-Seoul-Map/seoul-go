import { useEffect, useRef, useState } from "react";

import { ENTRY_EDITION_MODELS } from "../config/entryEditionModels";
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
    const modeledPlaces = source.filter((place) => Object.hasOwn(ENTRY_EDITION_MODELS, place.id));
    const selected = selectEntryEditionPlaces(modeledPlaces, loadPreviousEntryEditionIds());
    selectedRef.current = selected;
    savePreviousEntryEditionIds(selected.map((place) => place.id));
    setPlaces(selected);
  }, [source]);

  return places;
}
