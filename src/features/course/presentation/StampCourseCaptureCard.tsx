import type { ReactElement, Ref } from "react";

import type { SavedStampCoursePlace } from "../domain/stampCourse";
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
      </div>
    </div>
  );
}
