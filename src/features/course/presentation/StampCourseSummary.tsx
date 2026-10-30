import type { ReactElement } from "react";

import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
import { MAX_STAMP_COURSE_PLACES } from "../domain/stampCourse";
import { useStampCourseStore } from "../application/useStampCourseStore";
import "./stamp-course-summary.css";

type StampCourseSummaryProps = {
  onOpen?: () => void;
};

export function StampCourseSummary({ onOpen }: StampCourseSummaryProps): ReactElement {
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
      <span className="StampCourseSummaryLabel" role="status" aria-live="polite">
        스탬프 {count}/{MAX_STAMP_COURSE_PLACES}
      </span>
      <AppButton
        className="StampCourseSummaryButton"
        variant="secondary"
        aria-label="코스 보기"
        aria-disabled={!onOpen || undefined}
        aria-haspopup="dialog"
        onClick={onOpen}
        title="코스 보기"
      >
        <span className="StampCourseSummaryIcon" aria-hidden="true" />
      </AppButton>
    </AppBox>
  );
}
