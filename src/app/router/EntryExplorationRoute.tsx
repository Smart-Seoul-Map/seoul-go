import { useEffect, useState, type ReactElement } from "react";

import {
  EntryExplorationPage,
  getEntryAssetPlace,
  useEntryEditionSelection,
} from "@features/entry-exploration";
import {
  PlaceDetailHeaderMeta,
  PlaceDetailPanel,
  useSeoulEditionPlacesQuery,
  type PlaceDetailCardProps,
} from "@features/places";
import { FLOATING_PANEL_SHEET_OPTIONS, type PanelSnapPoint } from "@shared/ui/responsive-panel";
import { AppIconButton } from "@shared/ui/button";

import closeIcon from "../../assets/icons/close.svg";

import "./EntryExplorationRoute.css";

const ENTRY_PLACE_INITIAL_SNAP_POINT = FLOATING_PANEL_SHEET_OPTIONS.snapPoints[0];

type EntryPlacePanelProps = {
  place: PlaceDetailCardProps & { selectionYear?: number };
  open: boolean;
  onClose: () => void;
};

// 지도 장소 상세와 같은 머리글: 제목 옆 연도 배지, 오른쪽 끝 닫기.
function EntryPlacePanelActions({
  place,
  onClose,
}: Pick<EntryPlacePanelProps, "place" | "onClose">): ReactElement {
  return (
    <>
      <PlaceDetailHeaderMeta selectionYear={place.selectionYear} />
      <div className="PlaceDetailToolbar">
        <AppIconButton ariaLabel="장소 정보 닫기" size="md" onClick={onClose}>
          <img className="EntryPlacePanelCloseIcon" src={closeIcon} alt="" />
        </AppIconButton>
      </div>
    </>
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
  const query = useSeoulEditionPlacesQuery();
  const places = useEntryEditionSelection(query.data);

  const handleIntroBlocked = () => {
    void query.refetch({ cancelRefetch: false });
  };

  return (
    <EntryExplorationPage
      places={places}
      onIntroBlocked={handleIntroBlocked}
      renderPlacePanel={({ placeId, ...props }) => {
        const assetPlace = getEntryAssetPlace(placeId);
        if (assetPlace) {
          return <EntryPlacePanel key={placeId} place={assetPlace} {...props} />;
        }
        const place = places?.find((candidate) => candidate.id === placeId);
        return place ? (
          <EntryPlacePanel
            key={placeId}
            place={{
              title: place.name,
              description: place.description,
              address: place.address,
              selectionYear: place.selectionYear,
              image: { src: place.imageUrl, alt: place.name },
            }}
            {...props}
          />
        ) : null;
      }}
    />
  );
}
