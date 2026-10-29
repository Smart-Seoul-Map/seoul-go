import { useState } from "react";
import type { FocusEvent, KeyboardEvent, ReactElement, ReactNode } from "react";

import type { ExternalSearchProviderId } from "@shared/constants/externalSearch";
import { openExternalSearch } from "@shared/lib/externalSearch/externalSearchUrl";
import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
import {
  AppResponsivePanel,
  useResponsivePanelPresentation,
  type AppResponsivePanelContentProps,
} from "@shared/ui/responsive-panel";
import { AppText } from "@shared/ui/typography";
import type { PlaceDetailCardProps } from "./PlaceDetailCard";
import { PlaceDetailPanel } from "./PlaceDetailPanel";
import { getSelectionYearBadgeTone } from "@shared/constants/selectionYearBadge";
import "./map-place-detail-panel.css";

export type MapPlaceDetailPanelProps = Pick<
  AppResponsivePanelContentProps,
  "onExitComplete" | "returnFocus"
> & {
  open?: boolean;
  place: Pick<PlaceDetailCardProps, "title" | "image" | "description"> & {
    selectionYear?: number | string;
  };
  isStampAcquired?: boolean;
  mobileAboveContent?: ReactNode;
  onClose: () => void;
  onAddToCourse?: () => void;
};

const SEARCH_MENU_ITEMS: { providerId: ExternalSearchProviderId; label: string }[] = [
  { providerId: "NAVER", label: "네이버 검색" },
  { providerId: "GOOGLE_IMAGE", label: "구글 이미지 검색" },
];

function PlaceDetailHeaderMeta({
  place,
}: Pick<MapPlaceDetailPanelProps, "place">): ReactElement | null {
  const presentation = useResponsivePanelPresentation();
  if (place.selectionYear === undefined) return null;

  return (
    <div className="MapPlaceDetailMeta">
      <AppBadge
        size={presentation === "bottom-sheet" ? "number-sm" : "number-md"}
        tone={getSelectionYearBadgeTone(place.selectionYear)}
        variant="solid"
        textPolicy="singleLine"
      >
        {place.selectionYear}
      </AppBadge>
    </div>
  );
}

function PlaceSearchMenu({ title }: { title: string }): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !isOpen) return;
    event.stopPropagation();
    setIsOpen(false);
  };

  const handleSelect = (providerId: ExternalSearchProviderId) => {
    openExternalSearch(providerId, title);
    setIsOpen(false);
  };

  return (
    <AppBox
      className="MapPlaceDetailSearchMenu"
      position="relative"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="MapPlaceDetailSearch"
        aria-label={`${title} 검색`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="검색"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true" className="MapPlaceDetailSearchIcon" />
      </button>
      <AppBox
        className="MapPlaceDetailSearchList"
        data-open={isOpen}
        aria-hidden={!isOpen}
        inert={!isOpen}
        position="absolute"
        top="100%"
        right={0}
        zIndex={1}
        display="grid"
        minWidth="max-content"
        mt="spacing.1"
        p="spacing.1"
        bg="bg.surfacePaper"
        borderColor="stroke.weak"
        borderWidth="strokeWidth.surface"
        borderRadius="radius.4_5"
        boxShadow="shadow.raised"
      >
        <AppBox role="menu" display="flex" flexDirection="column" minHeight="0" overflowY="hidden">
          {SEARCH_MENU_ITEMS.map(({ providerId, label }) => (
            <AppButton
              key={providerId}
              role="menuitem"
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(providerId)}
            >
              {label}
            </AppButton>
          ))}
        </AppBox>
      </AppBox>
    </AppBox>
  );
}

function PlaceDetailActions({ place }: Pick<MapPlaceDetailPanelProps, "place">): ReactElement {
  return (
    <div className="MapPlaceDetailToolbar">
      <PlaceSearchMenu title={place.title} />
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
