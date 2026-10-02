import { useState, type ReactElement } from "react";

import { getSelectionYearBadgeTone } from "@shared/constants/selectionYearBadge";
import { AppBadge } from "@shared/ui/badge";
import { AppButton } from "@shared/ui/button";
import { AppTabs } from "@shared/ui/tabs";
import {
  AppResponsivePanel,
  FLOATING_PANEL_SIDE_OPTIONS,
  FLOATING_PANEL_SHEET_OPTIONS,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";
import type { LinkedPlaceReference } from "../domain/linkedPlaceReference";
import type { ExplorationPanelLifecycleProps } from "./ExplorationPage";
import "./linked-places.css";

export type LinkedNearbyPlace = { id: string; name: string; themeName: string };

export type LinkedPlacesContentProps = {
  references: readonly LinkedPlaceReference[];
  selected: LinkedPlaceReference | null;
  places: readonly LinkedNearbyPlace[];
  isLoading: boolean;
  isError: boolean;
  onSelect: (id: string) => void;
  onRetry: () => void;
};

function ReferenceImage({ imageUrl }: { imageUrl?: string }): ReactElement {
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  return (
    <img
      className="LinkedPlacesReferenceImage"
      alt=""
      width={64}
      height={64}
      draggable={false}
      src={imageUrl && imageUrl !== failedSrc ? imageUrl : "/images/seoul-characters/hachi.png"}
      onError={() => setFailedSrc(imageUrl)}
    />
  );
}

function NearbyPlaceList({
  selected,
  places,
  isLoading,
  isError,
  onRetry,
}: Pick<
  LinkedPlacesContentProps,
  "selected" | "places" | "isLoading" | "isError" | "onRetry"
>): ReactElement {
  if (isLoading)
    return (
      <p className="LinkedPlacesState" role="status">
        근처 장소를 찾고 있어요.
      </p>
    );
  if (isError)
    return (
      <div className="LinkedPlacesState">
        <p role="alert">근처 장소를 불러오지 못했어요.</p>
        <AppButton variant="outline" onClick={onRetry}>
          다시 시도
        </AppButton>
      </div>
    );
  if (places.length === 0)
    return (
      <p className="LinkedPlacesState" role="status">
        반경 1km 안에 연계 장소가 없어요.
      </p>
    );
  return (
    <ul className="LinkedPlacesList" aria-label="근처 연계 장소">
      {places.map((place) => (
        <li className="LinkedPlacesCard" key={place.id}>
          <span className="LinkedPlacesReferenceLabel">{selected?.name} 기준</span>
          <h3>{place.name}</h3>
          <div className="LinkedPlacesCardMeta">
            <AppBadge size="xs" tone="brand" variant="weak">
              {place.themeName}
            </AppBadge>
            <AppBadge size="xs" tone="neutral" variant="weak">
              반경 1km
            </AppBadge>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LinkedPlacesContent(props: LinkedPlacesContentProps): ReactElement {
  const { references, selected, places, isLoading, isError, onSelect } = props;
  if (!selected)
    return (
      <p className="LinkedPlacesState" role="status">
        코스에 담긴 서울에디션 장소가 없어요.
      </p>
    );
  return (
    <AppTabs.Root
      className="LinkedPlacesTabs"
      variant="card"
      value={selected.id}
      onValueChange={onSelect}
    >
      <AppTabs.List aria-label="추천 기준 서울에디션 장소">
        {references.map((place) => (
          <AppTabs.Trigger key={place.id} value={place.id} className="LinkedPlacesReference">
            <ReferenceImage imageUrl={place.imageUrl} />
            <span className="LinkedPlacesReferenceCopy">
              {place.selectionYear !== undefined && (
                <AppBadge
                  size="number-sm"
                  tone={getSelectionYearBadgeTone(place.selectionYear)}
                  variant="solid"
                  textPolicy="singleLine"
                >
                  {place.selectionYear}
                </AppBadge>
              )}
              <span className="LinkedPlacesReferenceName">{place.name}</span>
            </span>
          </AppTabs.Trigger>
        ))}
      </AppTabs.List>
      {references.map((place) => (
        <AppTabs.Content key={place.id} value={place.id}>
          {place.id === selected.id && (
            <>
              <div className="LinkedPlacesListHeading">
                <h2>근처 추천 장소{!isLoading && !isError ? ` ${places.length}` : ""}</h2>
                <p>{selected.name} 기준 · 반경 1km</p>
              </div>
              <NearbyPlaceList {...props} />
            </>
          )}
        </AppTabs.Content>
      ))}
    </AppTabs.Root>
  );
}

export function LinkedPlacesPanel({
  open = true,
  onClose,
  onExitComplete,
  returnFocus,
  ...content
}: LinkedPlacesContentProps & ExplorationPanelLifecycleProps): ReactElement {
  const [activeSnapPoint, setActiveSnapPoint] = useState<PanelSnapPoint | null>(
    FLOATING_PANEL_SHEET_OPTIONS.snapPoints[0]
  );
  return (
    <AppResponsivePanel.Root
      open={open}
      modal={false}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      sidePanelRootProps={FLOATING_PANEL_SIDE_OPTIONS}
      bottomSheetRootProps={{
        ...FLOATING_PANEL_SHEET_OPTIONS,
        activeSnapPoint,
        setActiveSnapPoint,
      }}
    >
      <AppResponsivePanel.Content
        className="LinkedPlacesPanel"
        title="근처 추천 장소"
        width="var(--sg-detail-width)"
        onExitComplete={onExitComplete}
        returnFocus={returnFocus}
        showHandle
      >
        <AppResponsivePanel.Body className="LinkedPlacesBody" aria-label="연계 장소 추천">
          <LinkedPlacesContent {...content} />
        </AppResponsivePanel.Body>
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}
