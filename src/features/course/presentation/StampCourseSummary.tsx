import type { ReactElement } from "react";

import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
import { useStampCourseStore } from "../application/useStampCourseStore";
import "./stamp-course-summary.css";

export function StampCourseSummary(): ReactElement {
  const count = useStampCourseStore((state) => state.places.length);

  return (
    <AppBox
      className="StampCourseSummary"
      bg="bg.surfacePaper"
      borderColor="stroke.weak"
      borderWidth="strokeWidth.surface"
      borderRadius="radius.5"
      boxShadow="shadow.raised"
    >
      <span className="StampCourseSummaryLabel">
        <span role="status" aria-live="polite">
          담은 코스 {count}개
        </span>
        <span aria-hidden="true"> · </span>
        <span>코스 보기</span>
      </span>
      <AppButton
        className="StampCourseSummaryButton"
        variant="secondary"
        aria-label="코스 보기"
        aria-disabled="true"
        title="코스 보기"
      >
        <span className="StampCourseSummaryIcon" aria-hidden="true" />
      </AppButton>
    </AppBox>
  );
}
