import { useEffect, useState, type ReactElement } from "react";

import {
  EntryExplorationPage,
  EntryExplorationIntroOverlay,
  ENTRY_HANOK_PLACE,
  ENTRY_HANOK_PLACE_ID,
  useEntryEditionSelection,
} from "@features/entry-exploration";
import {
  PlaceDetailPanel,
  useSeoulEditionPlacesQuery,
  type PlaceDetailCardProps,
} from "@features/places";
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
  place: PlaceDetailCardProps;
  open: boolean;
  onClose: () => void;
};

function EntryPlacePanelActions({
  place,
  onClose,
}: Pick<EntryPlacePanelProps, "place" | "onClose">): ReactElement {
  const presentation = useResponsivePanelPresentation();
  return (
    <AppHStack align="center" gap="sm">
      {presentation !== "bottom-sheet" && (
        <AppText role="detailSupporting" tone="muted" align="end">
          {place.subtitle}
        </AppText>
      )}
      <AppIconButton ariaLabel="장소 정보 닫기" size="sm" onClick={onClose}>
        <img src={closeIcon} alt="" width="20" height="20" />
      </AppIconButton>
    </AppHStack>
  );
}

function EntryPlacePanel({ place, open, onClose }: EntryPlacePanelProps): ReactElement {
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
      place={place}
      open={open}
      modal={false}
      className="EntryPlacePanel"
      headerTrailing={<EntryPlacePanelActions place={place} onClose={onClose} />}
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
  const query = useSeoulEditionPlacesQuery();
  const places = useEntryEditionSelection(query.data);

  if (!places) {
    const canRetry =
      !query.isFetching && (query.isError || query.isSuccess || query.fetchStatus === "idle");
    return (
      <main className="entry-exploration-page">
        <EntryExplorationIntroOverlay
          disabled={!canRetry}
          onStart={() => {
            void query.refetch();
          }}
          actionLabel={canRetry ? "장소 다시 불러오기" : "탐방 시작"}
        />
      </main>
    );
  }

  return (
    <EntryExplorationPage
      places={places}
      onSubwayStationSelectionChange={handleSubwayStationSelectionChange}
      subwayStationAvailabilityStatus={availabilityStatus}
      renderPlacePanel={({ placeId, ...props }) => {
        if (placeId === ENTRY_HANOK_PLACE_ID) {
          return <EntryPlacePanel key={placeId} place={ENTRY_HANOK_PLACE} {...props} />;
        }
        const place = places.find((candidate) => candidate.id === placeId);
        return place ? (
          <EntryPlacePanel
            key={placeId}
            place={{
              title: place.name,
              description: place.description,
              address: place.address,
              subtitle: place.selectionYear ? `${place.selectionYear} · 서울에디션` : "서울에디션",
              image: { src: place.imageUrl, alt: place.name },
            }}
            {...props}
          />
        ) : null;
      }}
    />
  );
}
