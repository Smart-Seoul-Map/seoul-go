import type { ReactElement } from "react";

import { AppButton } from "@shared/ui/button";
import { AppDialog } from "@shared/ui/dialog";
import { AppText } from "@shared/ui/typography";

import type { EntryExplorationSubwaySelectionViewModel } from "../application/useEntryExplorationSubwaySelection";

type SubwaySelectionControlsProps = {
  subwaySelection: EntryExplorationSubwaySelectionViewModel;
};

const CLOSE_ICON_LABEL = "×";

function getSelectionResultMessage({
  isSelectionInProgress,
  selectedStationName,
}: {
  isSelectionInProgress: boolean;
  selectedStationName: string | null;
}): string {
  if (isSelectionInProgress) {
    return "열차가 2호선을 달리고 있어요...";
  }

  if (selectedStationName) {
    return `${selectedStationName}역이 선정되었습니다.`;
  }

  return "본선과 지선 51개 역 중 한 곳을 선정해요.";
}

export function SubwaySelectionControls({
  subwaySelection,
}: SubwaySelectionControlsProps): ReactElement {
  const isSelectionInProgress = subwaySelection.status === "selecting";
  const isInputLocked = !subwaySelection.isCameraReady || isSelectionInProgress;
  const selectionButtonLabel =
    subwaySelection.status === "selected" ? "다시 선정하기" : "랜덤 역 선정하기";
  const resultMessage = getSelectionResultMessage({
    isSelectionInProgress,
    selectedStationName: subwaySelection.selectedStation?.name ?? null,
  });

  const handleOpenChange = (isOpen: boolean): void => {
    if (!isOpen && !isInputLocked) {
      subwaySelection.handleClose();
    }
  };

  return (
    <AppDialog
      actions={
        <AppButton
          disabled={isInputLocked}
          onClick={subwaySelection.handleStationSelection}
          variant="primary"
        >
          {isSelectionInProgress ? "선정 중..." : selectionButtonLabel}
        </AppButton>
      }
      closeAction={
        isInputLocked
          ? undefined
          : {
              ariaLabel: "탐색 화면으로 돌아가기",
              children: CLOSE_ICON_LABEL,
              onClick: subwaySelection.handleClose,
            }
      }
      closeOnEscape={!isInputLocked}
      closeOnInteractOutside={!isInputLocked}
      description="서울 지하철 2호선"
      onOpenChange={handleOpenChange}
      open={subwaySelection.isActive}
      title="오늘은 어느 역으로 떠날까요?"
    >
      <div aria-live="polite">
        <AppText
          role="dialogBody"
          tone={subwaySelection.selectedStation && !isSelectionInProgress ? "brand" : "muted"}
        >
          {resultMessage}
        </AppText>
      </div>
    </AppDialog>
  );
}
