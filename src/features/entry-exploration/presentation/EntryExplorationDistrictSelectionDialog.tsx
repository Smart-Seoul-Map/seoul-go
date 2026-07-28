import type { ReactElement } from "react";

import { AppButton } from "@shared/ui/button";
import { AppDialog } from "@shared/ui/dialog";
import { AppText } from "@shared/ui/typography";

export type EntryExplorationDistrictSelectionDialogProps = {
  districtId: number | null;
  districtName: string | null;
  onBack: () => void;
  onExplore: () => void;
  onRetry: () => void;
  open: boolean;
};

const BACK_ICON_LABEL = "←";

export function EntryExplorationDistrictSelectionDialog({
  districtId,
  districtName,
  onBack,
  onExplore,
  onRetry,
  open,
}: EntryExplorationDistrictSelectionDialogProps): ReactElement {
  const hasSelectedDistrict = districtId !== null && districtName !== null;
  const title = hasSelectedDistrict ? `${districtName} 선택` : "자치구 선택 실패";
  const description = hasSelectedDistrict
    ? "선택된 자치구에서 탐방을 시작할 수 있어요."
    : "지도 위에서 다시 튕겨 자치구를 선택해 주세요.";

  return (
    <AppDialog
      actions={
        <>
          <AppButton onClick={onRetry} variant="outline">
            다시 선택하기
          </AppButton>
          <AppButton disabled={!hasSelectedDistrict} onClick={onExplore} variant="primary">
            탐방하기
          </AppButton>
        </>
      }
      backAction={{
        ariaLabel: "일반 탐방으로 돌아가기",
        children: BACK_ICON_LABEL,
        onClick: onBack,
      }}
      closeOnInteractOutside={false}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onBack();
        }
      }}
      open={open}
      title={title}
    >
      <AppText role="dialogBody" tone="muted">
        {description}
      </AppText>
    </AppDialog>
  );
}
