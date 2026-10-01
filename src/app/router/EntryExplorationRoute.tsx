import { useEffect, useState, type ReactElement } from "react";

import {
  EntryExplorationPage,
  ENTRY_EXPLORATION_PLACES,
  type EntryExplorationPlaceId,
} from "@features/entry-exploration";
import { PlaceDetailPanel } from "@features/places";
import {
  FLOATING_PANEL_SHEET_OPTIONS,
  useResponsivePanelPresentation,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";
import { AppIconButton } from "@shared/ui/button";
import { AppHStack } from "@shared/ui/layout";
import { AppText } from "@shared/ui/typography";

import closeIcon from "../../assets/close.svg";

import { useSubwayStationAvailability } from "./useSubwayStationAvailability";

import "./EntryExplorationRoute.css";

const ENTRY_PLACE_INITIAL_SNAP_POINT = FLOATING_PANEL_SHEET_OPTIONS.snapPoints[0];

type EntryPlacePanelProps = {
  placeId: EntryExplorationPlaceId;
  open: boolean;
  onClose: () => void;
};

function EntryPlacePanelActions({
  placeId,
  onClose,
}: Pick<EntryPlacePanelProps, "placeId" | "onClose">): ReactElement {
  const presentation = useResponsivePanelPresentation();
  return (
    <AppHStack align="center" gap="sm">
      {presentation !== "bottom-sheet" && (
        <AppText role="detailSupporting" tone="muted" align="end">
          {ENTRY_EXPLORATION_PLACES[placeId].subtitle}
        </AppText>
      )}
      <AppIconButton ariaLabel="장소 정보 닫기" size="sm" onClick={onClose}>
        <img src={closeIcon} alt="" width="20" height="20" />
      </AppIconButton>
    </AppHStack>
  );
}

function EntryPlacePanel({ placeId, open, onClose }: EntryPlacePanelProps): ReactElement {
  const [entryPlaceSnapPoint, setEntryPlaceSnapPoint] = useState<PanelSnapPoint | null>(
    ENTRY_PLACE_INITIAL_SNAP_POINT
  );

  useEffect(() => {
    if (!open) {
      setEntryPlaceSnapPoint(ENTRY_PLACE_INITIAL_SNAP_POINT);
    }
  }, [open]);

  return (
    <PlaceDetailPanel
      place={ENTRY_EXPLORATION_PLACES[placeId]}
      open={open}
      modal={false}
      className="EntryPlacePanel"
      headerTrailing={<EntryPlacePanelActions placeId={placeId} onClose={onClose} />}
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
