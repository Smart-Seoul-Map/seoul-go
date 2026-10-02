import { useCallback, useMemo, useRef, useState } from "react";

import { ENTRY_EDITION_ARRIVAL_RADIUS } from "../config/entryEditionModels";
import { ENTRY_HANOK_ARRIVAL_RADIUS, ENTRY_HANOK_PLACE_ID } from "../config/entryHanokPlace";
import type { EntryEditionPlace, EntryExplorationPlaceId } from "../domain/entryEditionPlace";
import {
  createEntryExplorationPlaceVisit,
  type EntryExplorationPlaceVisit,
} from "../domain/entryExplorationPlaceVisit";

type PlacePanelState = {
  placeId: EntryExplorationPlaceId;
  open: boolean;
};

type PlacePanelCallbacks = {
  onVisit?: (placeId: EntryExplorationPlaceId) => void;
  onDismiss?: (placeId: EntryExplorationPlaceId) => void;
};

export function useEntryExplorationPlacePanel(
  places: readonly EntryEditionPlace[],
  callbacks: PlacePanelCallbacks = {}
) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const [panel, setPanel] = useState<PlacePanelState>({
    placeId: places[0]?.id ?? "",
    open: false,
  });
  const panelRef = useRef(panel);
  const placeVisits = useMemo<Record<EntryExplorationPlaceId, EntryExplorationPlaceVisit>>(() => {
    const createVisit = (placeId: EntryExplorationPlaceId, radius: number) =>
      createEntryExplorationPlaceVisit({
        radius,
        onOpenChange: (open) => {
          if (open) callbacksRef.current.onVisit?.(placeId);
          if (!open && panelRef.current.placeId !== placeId) return;
          panelRef.current = { placeId, open };
          setPanel(panelRef.current);
        },
      });

    return {
      ...Object.fromEntries(
        places.map((place) => [place.id, createVisit(place.id, ENTRY_EDITION_ARRIVAL_RADIUS)])
      ),
      [ENTRY_HANOK_PLACE_ID]: createVisit(ENTRY_HANOK_PLACE_ID, ENTRY_HANOK_ARRIVAL_RADIUS),
    };
  }, [places]);
  const dismissOpenPanel = useCallback((): boolean => {
    const current = panelRef.current;
    if (!current.open) return false;
    placeVisits[current.placeId]?.dismiss();
    callbacksRef.current.onDismiss?.(current.placeId);
    return true;
  }, [placeVisits]);

  return {
    placeVisits,
    dismissOpenPanel,
    panelProps: { ...panel, onClose: dismissOpenPanel },
  };
}
