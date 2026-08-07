import type { ReactElement } from "react";

import { AppButton } from "@shared/ui/button";
import { AppDialog } from "@shared/ui/dialog";
import { AppText } from "@shared/ui/typography";

import type { SubwayStationAvailabilityStatus } from "../application/subwayStationAvailability";
import type { EntryExplorationSubwaySelectionViewModel } from "../application/useEntryExplorationSubwaySelection";

export type SubwaySelectionDialogProps = {
  availabilityStatus?: SubwayStationAvailabilityStatus;
  onExplore: (stationId: string) => void;
  subwaySelection: EntryExplorationSubwaySelectionViewModel;
};

const CLOSE_ICON_LABEL = "×";
const SUBWAY_DIALOG_DESCRIPTION = "서울 지하철 2호선";

type SubwaySelectionGuideDialogProps = {
  isCameraReady: boolean;
  onConfirm: () => void;
};

function SubwaySelectionGuideDialog({
  isCameraReady,
  onConfirm,
}: SubwaySelectionGuideDialogProps): ReactElement {
  return (
    <AppDialog
      actions={
        <AppButton disabled={!isCameraReady} onClick={onConfirm} size="lg" variant="primary">
          확인
        </AppButton>
      }
      appearance="guide"
      closeOnEscape={false}
      description={SUBWAY_DIALOG_DESCRIPTION}
      descriptionTone="brand"
      open
      title="열차를 타고 오늘의 역을 만나보세요!"
    >
      <AppText align="center" role="dialogBody">
        확인을 누르면 열차가 움직여
        <br />
        <AppText as="span" tone="brand">
          2호선
        </AppText>{" "}
        내 출발할 역을 선정해요.
      </AppText>
    </AppDialog>
  );
}

function getSelectionResultMessage({
  availabilityStatus,
  hasSelectedStation,
}: {
  availabilityStatus: SubwayStationAvailabilityStatus;
  hasSelectedStation: boolean;
}): string {
  if (availabilityStatus === "checking") {
    return "주변 탐방지를 확인하고 있어요.";
  }

  if (availabilityStatus === "empty") {
    return "반경 1km에는 현재 탐방할 곳이 없어요. 다시 선정해 주세요.";
  }

  if (availabilityStatus === "error") {
    return "주변 탐방지를 불러오지 못했어요. 다시 선정해 주세요.";
  }

  return hasSelectedStation
    ? "선택한 2호선 역에서 탐방을 시작할 수 있어요."
    : "선정된 역을 확인해 주세요.";
}

export function SubwaySelectionDialog({
  availabilityStatus = "idle",
  onExplore,
  subwaySelection,
}: SubwaySelectionDialogProps): ReactElement | null {
  if (!subwaySelection.isActive) {
    return null;
  }

  if (subwaySelection.status === "idle") {
    return (
      <SubwaySelectionGuideDialog
        isCameraReady={subwaySelection.isCameraReady}
        onConfirm={subwaySelection.handleStationSelection}
      />
    );
  }

  if (subwaySelection.status === "selecting") {
    return null;
  }

  const isAvailabilityChecking = availabilityStatus === "checking";
  const canExplore = subwaySelection.selectedStation !== null && availabilityStatus === "available";
  const selectedStationTitle = subwaySelection.selectedStation
    ? `${subwaySelection.selectedStation.name}역`
    : "역 선정 결과";
  const resultMessage = getSelectionResultMessage({
    availabilityStatus,
    hasSelectedStation: subwaySelection.selectedStation !== null,
  });

  const handleOpenChange = (isOpen: boolean): void => {
    if (!isOpen) {
      subwaySelection.handleClose();
    }
  };

  const handleExplore = (): void => {
    if (!subwaySelection.selectedStation || !canExplore) {
      return;
    }

    onExplore(subwaySelection.selectedStation.id);
  };

  return (
    <AppDialog
      actions={
        <>
          <AppButton
            disabled={isAvailabilityChecking}
            onClick={subwaySelection.handleStationSelection}
            variant="outline"
          >
            다시 선택하기
          </AppButton>
          <AppButton disabled={!canExplore} onClick={handleExplore} variant="primary">
            탐방하기
          </AppButton>
        </>
      }
      closeAction={{
        ariaLabel: "탐색 화면으로 돌아가기",
        children: CLOSE_ICON_LABEL,
        onClick: subwaySelection.handleClose,
      }}
      closeOnInteractOutside
      onOpenChange={handleOpenChange}
      open
      title={selectedStationTitle}
      titleSize="lg"
    >
      <div aria-live="polite">
        <AppText role="dialogBody">{resultMessage}</AppText>
      </div>
    </AppDialog>
  );
}
