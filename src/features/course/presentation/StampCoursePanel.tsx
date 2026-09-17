import { useState, type ReactElement } from "react";

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
import { useStampCourseEditing } from "./useStampCourseEditing";
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
  hasEnoughPlacesForWalkRoute: boolean;
  onKakaoWalk: () => void;
};

function StampCourseFooter({
  isEmpty,
  isEditing,
  hasEnoughPlacesForWalkRoute,
  onKakaoWalk,
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
        disabled={isEmpty || isEditing}
        aria-label="이미지 저장"
        aria-disabled="true"
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
  const [activeSnapPoint, setActiveSnapPoint] = useState<PanelSnapPoint | null>(
    () => FLOATING_PANEL_SHEET_OPTIONS.snapPoints[places.length <= 2 ? 0 : 1]
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
            <span className="StampCourseCount" aria-label="담긴 코스 개수" aria-live="polite">
              {places.length}/{MAX_STAMP_COURSE_PLACES}
            </span>
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
              <AppResponsivePanel.CloseButton iconOnly />
            </div>
          </>
        }
        showCloseButton={false}
        showHandle
        className="StampCoursePanel"
        width="var(--sg-detail-width)"
      >
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
          hasEnoughPlacesForWalkRoute={places.length >= 2}
          onKakaoWalk={handleKakaoWalk}
        />
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}
