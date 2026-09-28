import type { ReactElement, Ref } from "react";

import { MAX_STAMP_COURSE_PLACES, type SavedStampCoursePlace } from "../domain/stampCourse";
import { StampCourseBoard } from "./StampCourseBoard";
import "./stamp-course-capture-card.css";

type StampCourseCaptureCardProps = {
  places: readonly SavedStampCoursePlace[];
  ref?: Ref<HTMLDivElement>;
};

function ignoreCaptureInteraction(): void {}

export function StampCourseCaptureCard({ places, ref }: StampCourseCaptureCardProps): ReactElement {
  return (
    <div className="StampCourseCapture" aria-hidden="true">
      <div className="StampCourseCaptureCard" ref={ref}>
        <StampCourseBoard
          places={places}
          isEditing={false}
          onRemove={ignoreCaptureInteraction}
          onReorder={ignoreCaptureInteraction}
        />
        {places.length === MAX_STAMP_COURSE_PLACES && (
          <div className="StampCourseMaxNote">
            {MAX_STAMP_COURSE_PLACES}개 코스가 모두 담겼어요. 삭제 후 다른 장소를 추가할 수 있어요.
          </div>
        )}
      </div>
    </div>
  );
}
