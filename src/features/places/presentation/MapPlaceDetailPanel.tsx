import type { ReactElement } from "react";

import { buildExternalSearchUrl } from "@shared/lib/externalSearch/externalSearchUrl";
import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
import { AppResponsivePanel } from "@shared/ui/responsive-panel";
import { AppText } from "@shared/ui/typography";
import { MAP_PLACE_DESCRIPTION } from "../config/mapPlaceDetail";
import type { PlaceDetailCardProps } from "./PlaceDetailCard";
import { PlaceDetailPanel } from "./PlaceDetailPanel";
import "./map-place-detail-panel.css";

export type MapPlaceDetailPanelProps = {
  place: Pick<PlaceDetailCardProps, "title" | "image">;
  isStampAcquired?: boolean;
  onClose: () => void;
  onAddToCourse?: () => void;
};

function PlaceDetailActions({ place }: Pick<MapPlaceDetailPanelProps, "place">): ReactElement {
  return (
    <div className="MapPlaceDetailToolbar">
      <div className="MapPlaceDetailBadges">
        <AppBadge tone="positive">방문 완료</AppBadge>
      </div>
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
      <AppResponsivePanel.CloseButton
        className="MapPlaceDetailClose"
        aria-label="닫기"
        title="닫기"
      >
        <span aria-hidden="true" className="MapPlaceDetailCloseIcon" />
      </AppResponsivePanel.CloseButton>
    </div>
  );
}

export function MapPlaceDetailPanel({
  place,
  isStampAcquired = false,
  onClose,
  onAddToCourse,
}: MapPlaceDetailPanelProps): ReactElement {
  return (
    <PlaceDetailPanel
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="MapPlaceDetailPanel"
      place={{
        ...place,
        subtitle: "",
        description: MAP_PLACE_DESCRIPTION,
      }}
      headerLeading={<PlaceDetailActions place={place} />}
      footer={
        <AppButton
          className="MapPlaceDetailAddButton"
          variant="primary"
          size="lg"
          disabled={!onAddToCourse}
          onClick={onAddToCourse}
        >
          스탬프/코스 추가
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
