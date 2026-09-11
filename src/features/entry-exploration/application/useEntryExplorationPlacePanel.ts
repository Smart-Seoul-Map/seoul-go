import { useState } from "react";

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

export function useEntryExplorationPlacePanel() {
  const [panel, setPanel] = useState<PlacePanelState>({ placeId: "hanok", open: false });
  const [placeVisits] = useState(() => {
    const createVisit = (placeId: EntryExplorationPlaceId) =>
      createEntryExplorationPlaceVisit({
        radius: ENTRY_EXPLORATION_PLACE_ARRIVAL_RADIUS_BY_ID[placeId],
        onOpenChange: (open) =>
          setPanel((current) => {
            const isClosingOtherPlace = !open && current.placeId !== placeId;

            return isClosingOtherPlace ? current : { placeId, open };
          }),
      });

    return {
      hanok: createVisit("hanok"),
      tower: createVisit("tower"),
    } satisfies Record<EntryExplorationPlaceId, EntryExplorationPlaceVisit>;
  });

  return {
    placeVisits,
    panelProps: { ...panel, onClose: placeVisits[panel.placeId].dismiss },
  };
}
