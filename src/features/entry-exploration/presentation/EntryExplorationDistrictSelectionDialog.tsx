import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { AppButton } from "@shared/ui/button";
import { AppDialog } from "@shared/ui/dialog";
import { AppText } from "@shared/ui/typography";

import type { EntryExplorationDistrictSelectionResult } from "../application/entryExplorationDistrictJumpSelectionInteraction";

export type EntryExplorationDistrictSelectionDialogProps = {
  onBack: () => void;
  onExplore: (districtId: number) => void;
  onRetry: () => void;
  selectionResult: EntryExplorationDistrictSelectionResult | null;
};

const BACK_ICON_LABEL = "←";

export function EntryExplorationDistrictSelectionDialog({
  onBack,
  onExplore,
  onRetry,
  selectionResult,
}: EntryExplorationDistrictSelectionDialogProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDistrictId = selectionResult?.districtId ?? null;
  const selectedDistrictName = selectionResult?.districtName ?? null;
  const hasSelectedDistrict = selectedDistrictId !== null && selectedDistrictName !== null;
  const title = hasSelectedDistrict ? `${selectedDistrictName} 선택` : "자치구 선택 실패";
  const description = hasSelectedDistrict
    ? "선택한 자치구에서 탐방을 시작할 수 있어요."
    : "지도 위에서 다시 원하는 자치구를 선택해 주세요.";

  useEffect(() => {
    if (selectionResult) {
      setIsOpen(true);
    }
  }, [selectionResult]);

  const closeDialog = (): void => {
    setIsOpen(false);
  };

  const handleBack = (): void => {
    closeDialog();
    onBack();
  };

  const handleRetry = (): void => {
    closeDialog();
    onRetry();
  };

  const handleExplore = (): void => {
    if (selectedDistrictId === null) {
      return;
    }

    onExplore(selectedDistrictId);
  };

  return (
    <AppDialog
      actions={
        <>
          <AppButton onClick={handleRetry} variant="outline">
            다시 선택하기
          </AppButton>
          <AppButton disabled={!hasSelectedDistrict} onClick={handleExplore} variant="primary">
            탐방하기
          </AppButton>
        </>
      }
      backAction={{
        ariaLabel: "일반 탐방으로 돌아가기",
        children: BACK_ICON_LABEL,
        onClick: handleBack,
      }}
      closeOnInteractOutside={false}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleBack();
        }
      }}
      open={isOpen}
      title={title}
    >
      <AppText role="dialogBody" tone="muted">
        {description}
      </AppText>
    </AppDialog>
  );
}
