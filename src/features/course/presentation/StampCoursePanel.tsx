import { useState, type ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";
import { AppButton, AppTextButton } from "@shared/ui/button";
import { useAppToast } from "@shared/ui/toast";
import {
  AppResponsivePanel,
  FLOATING_PANEL_SIDE_OPTIONS,
  FLOATING_PANEL_SHEET_OPTIONS,
  type AppResponsivePanelContentProps,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";

import { useStampCourseStore } from "../application/useStampCourseStore";
import { MAX_STAMP_COURSE_PLACES } from "../domain/stampCourse";
import { createKakaoWalkRouteUrl } from "../domain/stampCourseKakaoWalkUrl";
import { StampCourseBoard } from "./StampCourseBoard";
import { StampCourseCaptureCard } from "./StampCourseCaptureCard";
import { useStampCourseEditing } from "./useStampCourseEditing";
import { useStampCourseImageDownload } from "./useStampCourseImageDownload";
import "./stamp-course-panel.css";

type StampCoursePanelProps = Pick<
  AppResponsivePanelContentProps,
  "onExitComplete" | "returnFocus"
> & {
  open?: boolean;
  onClose: () => void;
};

type StampCourseFooterProps = {
  isEmpty: boolean;
  isEditing: boolean;
  canDownloadImage: boolean;
  hasEnoughPlacesForWalkRoute: boolean;
  onKakaoWalk: () => void;
  onDownloadImage: () => void;
};

function StampCourseFooter({
  isEmpty,
  isEditing,
  canDownloadImage,
  hasEnoughPlacesForWalkRoute,
  onKakaoWalk,
  onDownloadImage,
}: StampCourseFooterProps): ReactElement {
  return (
    <AppResponsivePanel.Footer className="StampCourseFooter">
      <AppButton
        className="StampCourseAction"
        data-action="kakao"
        disabled={!hasEnoughPlacesForWalkRoute || isEditing}
        onClick={onKakaoWalk}
        aria-label="카카오 도보길찾기"
        title="카카오 도보길찾기"
      >
        <span className="StampCourseActionIcon" data-icon="external" aria-hidden="true" />
      </AppButton>
      <AppButton
        className="StampCourseAction"
        data-action="naver"
        disabled={isEmpty || isEditing}
        aria-label="네이버 도보길찾기"
        title="네이버 도보길찾기"
        aria-disabled="true"
      >
        <span className="StampCourseActionIcon" data-icon="external" aria-hidden="true" />
      </AppButton>
      <AppButton
        className="StampCourseAction"
        data-action="save"
        disabled={isEmpty || isEditing || !canDownloadImage}
        onClick={onDownloadImage}
        aria-label="이미지 저장"
      >
        <span className="StampCourseActionIcon" data-icon="download" aria-hidden="true" />
        <span>이미지 저장</span>
      </AppButton>
      <AppButton
        className="StampCourseAction"
        data-action="share"
        disabled={isEmpty || isEditing}
        aria-label="링크 공유"
        aria-disabled="true"
      >
        <span className="StampCourseActionIcon" data-icon="link" aria-hidden="true" />
        <span>링크 공유</span>
      </AppButton>
    </AppResponsivePanel.Footer>
  );
}

export function StampCoursePanel({
  onClose,
  open = true,
  onExitComplete,
  returnFocus,
}: StampCoursePanelProps): ReactElement {
  const places = useStampCourseStore((state) => state.places);
  const { showToast } = useAppToast();
  const editing = useStampCourseEditing(open, onClose);
  const imageDownload = useStampCourseImageDownload(places);
  const [activeSnapPoint, setActiveSnapPoint] = useState<PanelSnapPoint | null>(() =>
    places.length <= 2 ? 0.5 : FLOATING_PANEL_SHEET_OPTIONS.snapPoints[1]
  );

  const handleKakaoWalk = () => {
    const result = createKakaoWalkRouteUrl(places);
    if (result.status === "not-enough-places") {
      showToast({ message: "도보길찾기는 장소를 2개 이상 담아주세요" });
      return;
    }
    if (result.status !== "created") {
      showToast({ message: "코스 정보를 확인해 주세요. 길찾기를 열 수 없어요" });
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  return (
    <AppResponsivePanel.Root
      open={open}
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      sidePanelRootProps={FLOATING_PANEL_SIDE_OPTIONS}
      bottomSheetRootProps={{
        ...FLOATING_PANEL_SHEET_OPTIONS,
        snapPoints: [0.5, FLOATING_PANEL_SHEET_OPTIONS.snapPoints[1]],
        activeSnapPoint,
        setActiveSnapPoint,
      }}
    >
      <AppResponsivePanel.Content
        title="담긴 코스"
        onExitComplete={onExitComplete}
        returnFocus={returnFocus}
        headerClassName="StampCourseHeader"
        headerTrailing={
          <>
            <div className="StampCourseHeaderActions">
              <AppTextButton
                size="sm"
                variant={editing.isEditing ? "danger" : "neutral"}
                disabled={places.length === 0}
                onClick={editing.isEditing ? editing.handleClearPlaces : editing.startEditing}
              >
                {editing.isEditing ? "전체 삭제" : "편집"}
              </AppTextButton>
              {editing.isEditing && (
                <AppTextButton size="sm" variant="neutral" onClick={editing.finishEditing}>
                  완료
                </AppTextButton>
              )}
            </div>
            <span className="StampCourseCount" aria-label="담긴 코스 개수" aria-live="polite">
              {places.length}/{MAX_STAMP_COURSE_PLACES}
            </span>
          </>
        }
        showCloseButton={false}
        showHandle
        className="StampCoursePanel"
        width="var(--sg-detail-width)"
      >
        <div className="StampCourseBanner">
          <div className="StampCourseBannerTop">
            <AppBadge variant="solid" tone="brand" size="sm" leading="✦">
              탐방 완료하고 공유 하자!
            </AppBadge>
            <AppResponsivePanel.CloseButton iconOnly />
          </div>
        </div>
        <AppResponsivePanel.Body className="StampCourseBody" aria-label="담긴 장소 목록">
          <StampCourseBoard
            places={places}
            isEditing={open && editing.isEditing}
            onRemove={editing.handleRemovePlace}
            onReorder={editing.handleReorderPlaces}
          />
        </AppResponsivePanel.Body>
        <StampCourseFooter
          isEmpty={places.length === 0}
          isEditing={editing.isEditing}
          canDownloadImage={imageDownload.canDownloadImage}
          hasEnoughPlacesForWalkRoute={places.length >= 2}
          onKakaoWalk={handleKakaoWalk}
          onDownloadImage={imageDownload.handleDownloadImage}
        />
        <div
          className="StampCourseMaxNote"
          data-visible={places.length === MAX_STAMP_COURSE_PLACES}
          aria-hidden={places.length !== MAX_STAMP_COURSE_PLACES}
        >
          {MAX_STAMP_COURSE_PLACES}개 코스가 모두 담겼어요. 삭제 후 다른 장소를 추가할 수 있어요.
        </div>
        <StampCourseCaptureCard
          places={imageDownload.capturePlaces}
          ref={imageDownload.captureRef}
        />
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}
