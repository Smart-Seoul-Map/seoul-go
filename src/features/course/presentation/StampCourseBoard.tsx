import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";
import { AppButton } from "@shared/ui/button";

import type { SavedStampCoursePlace } from "../domain/stampCourse";
import { createStampCourseSlots } from "../domain/stampCourseSlots";
import { useStampCourseDrag } from "./useStampCourseDrag";

type StampCourseBoardProps = {
  places: readonly SavedStampCoursePlace[];
  isEditing: boolean;
  onRemove: (placeId: string) => void;
  onReorder: (placeId: string, targetPlaceId: string) => void;
};

function StampCourseSealContent({
  imageUrl,
  isFilled,
}: {
  imageUrl?: string;
  isFilled: boolean;
}): ReactElement {
  const [failedUrl, setFailedUrl] = useState<string>();

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <img
        className="StampCourseSealImage"
        src={imageUrl}
        alt=""
        draggable={false}
        onError={() => setFailedUrl(imageUrl)}
      />
    );
  }

  if (isFilled) {
    return (
      <img
        className="StampCourseSealImage"
        src="/images/seoul-characters/hachi.png"
        alt=""
        draggable={false}
      />
    );
  }

  return (
    <>
      <span aria-hidden="true">GO</span>
      <small aria-hidden="true">STAMP</small>
    </>
  );
}

export function StampCourseBoard({
  places,
  isEditing,
  onRemove,
  onReorder,
}: StampCourseBoardProps): ReactElement {
  const drag = useStampCourseDrag(isEditing, onReorder);
  const slots = createStampCourseSlots(places);
  const pendingFocusIndex = useRef<number | null>(null);
  const { boardRef } = drag;

  useLayoutEffect(() => {
    const index = pendingFocusIndex.current;
    if (index === null) return;
    pendingFocusIndex.current = null;
    const handles = boardRef.current?.querySelectorAll<HTMLButtonElement>(".StampCourseDragHandle");
    const nextHandle = handles?.[Math.min(index, handles.length - 1)];
    const target = nextHandle ?? boardRef.current?.closest<HTMLElement>(".StampCourseBody");
    target?.focus();
  }, [places, boardRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const target = places[index + delta];
    if (target) onReorder(places[index].id, target.id);
  };

  return (
    <ol
      ref={drag.boardRef}
      className="StampCourseBoard"
      aria-label="스탬프 코스"
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerEnd}
      onPointerCancel={drag.handlePointerEnd}
      onLostPointerCapture={drag.handlePointerEnd}
    >
      {slots.map((slot) => (
        <li
          key={slot.place?.id ?? `empty-${slot.index}`}
          className="StampCourseSlot"
          data-filled={slot.status === "filled"}
          data-course-place-id={slot.place?.id}
          data-dragging={!!slot.place && drag.draggingId === slot.place.id}
          data-drop-target={
            !!slot.place &&
            drag.draggingId !== null &&
            drag.targetId === slot.place.id &&
            drag.draggingId !== slot.place.id
          }
          aria-label={
            slot.place ? `${slot.index + 1}번 ${slot.place.name}` : `${slot.index + 1}번 빈 스탬프`
          }
        >
          <div className="StampCourseSealWrapper">
            {isEditing && slot.place ? (
              <>
                <AppButton
                  className="StampCourseSeal StampCourseDragHandle"
                  aria-label={`${slot.place.name} 순서 변경`}
                  aria-description="드래그하거나 위아래 방향키로 순서를 변경합니다."
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  title={`${slot.place.name} 순서 변경`}
                  onPointerDown={(event) => drag.handlePointerDown(event, slot.place.id)}
                  onKeyDown={(event) => handleKeyDown(event, slot.index)}
                >
                  <StampCourseSealContent imageUrl={slot.place.imageUrl} isFilled />
                </AppButton>
                <AppButton
                  className="StampCourseRemoveButton"
                  variant="ghost"
                  size="xs"
                  aria-label={`${slot.place.name} 삭제`}
                  title={`${slot.place.name} 삭제`}
                  onClick={() => {
                    pendingFocusIndex.current = slot.index;
                    onRemove(slot.place.id);
                  }}
                >
                  <span className="StampCourseRemoveIcon" aria-hidden="true" />
                </AppButton>
              </>
            ) : (
              <span className="StampCourseSeal" aria-hidden="true">
                <StampCourseSealContent imageUrl={slot.place?.imageUrl} isFilled={!!slot.place} />
              </span>
            )}
          </div>
          {slot.place ? (
            <span className="StampCoursePlaceName" title={slot.place.name}>
              <AppBadge size="xs" variant="outline" width="fill" textPolicy="twoLines">
                {slot.place.name}
              </AppBadge>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
