import { useEffect, useRef, useState } from "react";

import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { selectEntryEditionPlaces } from "../domain/selectEntryEditionPlaces";

export function useEntryEditionSelection(source: readonly EntryEditionPlace[] | undefined) {
  const selectedRef = useRef<readonly EntryEditionPlace[] | null>(null);
  const [places, setPlaces] = useState<readonly EntryEditionPlace[] | null>(null);

  useEffect(() => {
    if (!source?.length || selectedRef.current) return;
    const selected = selectEntryEditionPlaces(source);
    selectedRef.current = selected;
    setPlaces(selected);
  }, [source]);

  return places;
}
