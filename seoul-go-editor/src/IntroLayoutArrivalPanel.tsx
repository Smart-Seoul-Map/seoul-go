import { useState, type ReactElement } from "react";

import { AppIconButton } from "@shared/ui/button";
import { AppHStack } from "@shared/ui/layout";
import {
  FLOATING_PANEL_SHEET_OPTIONS,
  useResponsivePanelPresentation,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";
import { AppText } from "@shared/ui/typography";

import { PlaceDetailPanel, type PlaceDetailCardProps } from "@features/places";

import closeIcon from "../../src/assets/icons/close.svg";

const ARRIVAL_PANEL_INITIAL_SNAP_POINT = FLOATING_PANEL_SHEET_OPTIONS.snapPoints[0];

type IntroLayoutArrivalPanelProps = {
  place: PlaceDetailCardProps;
  onClose: () => void;
};

function IntroLayoutArrivalPanelActions({
  place,
  onClose,
}: IntroLayoutArrivalPanelProps): ReactElement {
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

export function IntroLayoutArrivalPanel({
  place,
  onClose,
}: IntroLayoutArrivalPanelProps): ReactElement {
  const [snapPoint, setSnapPoint] = useState<PanelSnapPoint | null>(
    ARRIVAL_PANEL_INITIAL_SNAP_POINT
  );

  return (
    <PlaceDetailPanel
      place={place}
      open
      modal={false}
      className="EntryPlacePanel"
      headerTrailing={<IntroLayoutArrivalPanelActions place={place} onClose={onClose} />}
      mobileActiveSnapPoint={snapPoint}
      onMobileSnapPointChange={setSnapPoint}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    />
  );
}
