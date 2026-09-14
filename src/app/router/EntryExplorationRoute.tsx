import { useEffect, useState, type ReactElement } from "react";

import {
  EntryExplorationPage,
  ENTRY_EXPLORATION_PLACES,
  type EntryExplorationPlaceId,
} from "@features/entry-exploration";
import { PlaceDetailPanel } from "@features/places";
import type { PanelSnapPoint } from "@shared/ui/responsive-panel";

import { useSubwayStationAvailability } from "./useSubwayStationAvailability";

const ENTRY_PLACE_SNAP_POINTS: PanelSnapPoint[] = [0.5, 0.9];

type EntryPlacePanelProps = {
  placeId: EntryExplorationPlaceId;
  open: boolean;
  onClose: () => void;
};

function EntryPlacePanel({ placeId, open, onClose }: EntryPlacePanelProps): ReactElement {
  const [entryPlaceSnapPoint, setEntryPlaceSnapPoint] = useState<PanelSnapPoint | null>(
    ENTRY_PLACE_SNAP_POINTS[0]
  );

  useEffect(() => {
    if (!open) {
      setEntryPlaceSnapPoint(ENTRY_PLACE_SNAP_POINTS[0]);
    }
  }, [open]);

  return (
    <PlaceDetailPanel
      place={ENTRY_EXPLORATION_PLACES[placeId]}
      open={open}
      modal={false}
      mobileMaxHeight="var(--sg-detail-sheet-max-height)"
      mobileSnapPoints={ENTRY_PLACE_SNAP_POINTS}
      mobileActiveSnapPoint={entryPlaceSnapPoint}
      onMobileSnapPointChange={setEntryPlaceSnapPoint}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    />
  );
}

export function EntryExplorationRoute(): ReactElement {
  const { availabilityStatus, handleSubwayStationSelectionChange } = useSubwayStationAvailability();

  return (
    <EntryExplorationPage
      onSubwayStationSelectionChange={handleSubwayStationSelectionChange}
      subwayStationAvailabilityStatus={availabilityStatus}
      renderPlacePanel={({ placeId, ...props }) => (
        <EntryPlacePanel key={placeId} placeId={placeId} {...props} />
      )}
    />
  );
}
