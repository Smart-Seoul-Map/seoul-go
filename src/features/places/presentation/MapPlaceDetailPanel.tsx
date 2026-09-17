import type { ReactElement, ReactNode } from "react";

import { buildExternalSearchUrl } from "@shared/lib/externalSearch/externalSearchUrl";
import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
import {
  AppResponsivePanel,
  type AppResponsivePanelContentProps,
} from "@shared/ui/responsive-panel";
import { AppText } from "@shared/ui/typography";
import { MAP_PLACE_DESCRIPTION } from "../config/mapPlaceDetail";
import type { PlaceDetailCardProps } from "./PlaceDetailCard";
import { PlaceDetailPanel } from "./PlaceDetailPanel";
import "./map-place-detail-panel.css";

export type MapPlaceDetailPanelProps = Pick<
  AppResponsivePanelContentProps,
  "onExitComplete" | "returnFocus"
> & {
  open?: boolean;
  place: Pick<PlaceDetailCardProps, "title" | "image"> & { selectionYear?: number | string };
  isStampAcquired?: boolean;
  mobileAboveContent?: ReactNode;
  onClose: () => void;
  onAddToCourse?: () => void;
};

function PlaceDetailHeaderMeta({ place }: Pick<MapPlaceDetailPanelProps, "place">): ReactElement {
  return (
    <div className="MapPlaceDetailMeta">
      <AppBadge tone="positive">{place.selectionYear ?? "방문 완료"}</AppBadge>
    </div>
  );
}

function PlaceDetailActions({ place }: Pick<MapPlaceDetailPanelProps, "place">): ReactElement {
  return (
    <div className="MapPlaceDetailToolbar">
      <a
        className="MapPlaceDetailSearch"
        href={buildExternalSearchUrl("NAVER", place.title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${place.title} 네이버 검색`}
        title="네이버 검색"
      >
        <span aria-hidden="true" className="MapPlaceDetailSearchIcon" />
      </a>
      <AppResponsivePanel.CloseButton iconOnly />
    </div>
  );
}

export function MapPlaceDetailPanel({
  place,
  isStampAcquired = false,
  mobileAboveContent,
  onClose,
  onAddToCourse,
  open = true,
  onExitComplete,
  returnFocus,
}: MapPlaceDetailPanelProps): ReactElement {
  return (
    <PlaceDetailPanel
      open={open}
      onExitComplete={onExitComplete}
      returnFocus={returnFocus}
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="MapPlaceDetailPanel"
      mobileAboveContent={mobileAboveContent}
      place={{
        ...place,
        subtitle: "",
        description: MAP_PLACE_DESCRIPTION,
      }}
      headerTrailing={
        <>
          <PlaceDetailHeaderMeta place={place} />
          <PlaceDetailActions place={place} />
        </>
      }
      footer={
        <AppButton
          className="MapPlaceDetailAddButton"
          data-acquired={isStampAcquired}
          variant="primary"
          size="lg"
          disabled={!onAddToCourse}
          onClick={onAddToCourse}
        >
          {isStampAcquired ? "스탬프/코스 완료" : "스탬프/코스 추가"}
        </AppButton>
      }
    >
      <AppBox
        className="MapPlaceDetailStamp"
        bg="bg.surfacePaper"
        borderColor="stroke.weak"
        borderWidth="strokeWidth.surface"
        borderRadius="radius.4_5"
        boxShadow="shadow.raised"
        px="spacing.4"
        py="spacing.3"
      >
        <AppText role="supporting" tone="muted">
          스탬프
        </AppText>
        <AppText role="supporting">{isStampAcquired ? "획득 완료" : "아직 획득 전"}</AppText>
      </AppBox>
    </PlaceDetailPanel>
  );
}
