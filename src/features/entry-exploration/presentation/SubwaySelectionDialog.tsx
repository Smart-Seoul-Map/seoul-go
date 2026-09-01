import type { ReactElement, ReactNode } from "react";

import { AppButton } from "@shared/ui/button";
import { AppDialog } from "@shared/ui/dialog";
import { AppVStack } from "@shared/ui/layout";
import { AppText } from "@shared/ui/typography";

import type { SubwayStationAvailabilityStatus } from "../application/subwayStationAvailability";
import type { EntryExplorationSubwaySelectionViewModel } from "../application/useEntryExplorationSubwaySelection";
import { SubwaySelectionGuide } from "./SubwaySelectionGuide";

import "./SubwaySelectionDialog.css";

export type SubwaySelectionDialogProps = {
  availabilityStatus?: SubwayStationAvailabilityStatus;
  onExplore: (stationId: string) => void;
  subwaySelection: EntryExplorationSubwaySelectionViewModel;
};

const CLOSE_ICON_LABEL = "×";

function getSelectionResultLines({
  availabilityStatus,
  selectedStationName,
}: {
  availabilityStatus: SubwayStationAvailabilityStatus;
  selectedStationName: string | null;
}): ReactNode[] {
  if (availabilityStatus === "checking") {
    return ["반경 1km 내 탐방지를 확인하고 있습니다."];
  }

  if (availabilityStatus === "empty") {
    return ["반경 1km 내에 탐방할 곳이 없습니다.", "다른 역으로 다시 선정해 주세요."];
  }

  if (availabilityStatus === "error") {
    return ["주변 탐방지를 불러오지 못했습니다.", "다시 선정해 주세요."];
  }

  if (!selectedStationName) {
    return ["선정된 역을 확인해 주세요."];
  }

  return [
    "출발역이 선정되었습니다.",
    <>
      <AppText as="span" tone="brand">
        {`${selectedStationName}역`}
      </AppText>
      {"에서 탐방을 시작해 보세요!"}
    </>,
  ];
}

export function SubwaySelectionDialog({
  availabilityStatus = "idle",
  onExplore,
  subwaySelection,
}: SubwaySelectionDialogProps): ReactElement | null {
  if (!subwaySelection.isActive || subwaySelection.status === "selecting") {
    return null;
  }

  if (subwaySelection.status === "idle") {
    return (
      <SubwaySelectionGuide
        isCameraReady={subwaySelection.isCameraReady}
        onClose={subwaySelection.handleClose}
        onConfirm={subwaySelection.handleStationSelection}
      />
    );
  }

  const isAvailabilityChecking = availabilityStatus === "checking";
  const canExplore = subwaySelection.selectedStation !== null && availabilityStatus === "available";
  const selectedStationTitle = subwaySelection.selectedStation
    ? `${subwaySelection.selectedStation.name}역`
    : "역 선정 결과";
  const resultLines = getSelectionResultLines({
    availabilityStatus,
    selectedStationName: subwaySelection.selectedStation?.name ?? null,
  });

  const handleOpenChange = (isOpen: boolean): void => {
    if (isOpen) {
      return;
    }

    subwaySelection.handleClose();
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
    >
      <div aria-live="polite" className="subway-selection-result">
        <AppVStack align="stretch" gap="xs">
          {resultLines.map((line, index) => (
            <AppText key={index} role="dialogBody">
              {line}
            </AppText>
          ))}
        </AppVStack>
      </div>
    </AppDialog>
  );
}
