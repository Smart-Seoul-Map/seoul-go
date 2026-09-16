import { useEffect, useState } from "react";

import { useAppToast } from "@shared/ui/toast";

import { stampCourseStore, useStampCourseStore } from "../application/useStampCourseStore";

export function useStampCourseEditing(open: boolean, onClose: () => void) {
  const [isEditing, setIsEditing] = useState(false);
  const removePlace = useStampCourseStore((state) => state.removePlace);
  const restoreRemovedPlace = useStampCourseStore((state) => state.restoreRemovedPlace);
  const clearPlaces = useStampCourseStore((state) => state.clearPlaces);
  const { showToast } = useAppToast();

  useEffect(() => {
    if (!open) setIsEditing(false);
  }, [open]);

  const handleRemovePlace = (placeId: string) => {
    const result = removePlace(placeId);
    if (result.status !== "removed") return;

    showToast({
      message: "코스에서 장소를 삭제했어요",
      actionLabel: "실행 취소",
      onAction: () => {
        const restored = restoreRemovedPlace(result.removedPlace);
        if (restored.status === "skipped") {
          showToast({ message: "이미 담긴 장소이거나 코스가 가득 차 복구할 수 없어요" });
        }
      },
    });
  };

  const handleClearPlaces = () => {
    clearPlaces();
    // Replacing the active toast also removes the previous single-place undo action.
    showToast({ message: "코스를 모두 삭제했어요" });
    onClose();
  };

  const handleReorderPlaces = (placeId: string, targetPlaceId: string) => {
    const { places, reorderPlaces } = stampCourseStore.getState();
    reorderPlaces({
      fromIndex: places.findIndex((place) => place.id === placeId),
      toIndex: places.findIndex((place) => place.id === targetPlaceId),
    });
  };

  return {
    isEditing,
    startEditing: () => setIsEditing(true),
    handleRemovePlace,
    handleClearPlaces,
    handleReorderPlaces,
  };
}
