import { useCallback, useRef, useState } from "react";

import {
  ENTRY_EXPLORATION_PLACE_ARRIVAL_RADIUS_BY_ID,
  type EntryExplorationPlaceId,
} from "../config/entryExplorationPlace";
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

export function useEntryExplorationPlacePanel(callbacks: PlacePanelCallbacks = {}) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const [panel, setPanel] = useState<PlacePanelState>({ placeId: "hanok", open: false });
  const panelRef = useRef(panel);
  const [placeVisits] = useState(() => {
    const createVisit = (placeId: EntryExplorationPlaceId) =>
      createEntryExplorationPlaceVisit({
        radius: ENTRY_EXPLORATION_PLACE_ARRIVAL_RADIUS_BY_ID[placeId],
        onOpenChange: (open) => {
          if (open) callbacksRef.current.onVisit?.(placeId);
          if (!open && panelRef.current.placeId !== placeId) return;
          panelRef.current = { placeId, open };
          setPanel(panelRef.current);
        },
      });

    return {
      hanok: createVisit("hanok"),
      tower: createVisit("tower"),
    } satisfies Record<EntryExplorationPlaceId, EntryExplorationPlaceVisit>;
  });
  const dismissOpenPanel = useCallback((): boolean => {
    const current = panelRef.current;
    if (!current.open) return false;
    placeVisits[current.placeId].dismiss();
    callbacksRef.current.onDismiss?.(current.placeId);
    return true;
  }, [placeVisits]);

  return {
    placeVisits,
    dismissOpenPanel,
    panelProps: { ...panel, onClose: dismissOpenPanel },
  };
}
