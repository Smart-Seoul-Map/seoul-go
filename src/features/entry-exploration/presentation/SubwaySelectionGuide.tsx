import type { MouseEvent, ReactElement } from "react";

import { AppButton } from "@shared/ui/button";
import { AppVStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import "./SubwaySelectionGuide.css";

export type SubwaySelectionGuideProps = {
  isCameraReady: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function SubwaySelectionGuide({
  isCameraReady,
  onClose,
  onConfirm,
}: SubwaySelectionGuideProps): ReactElement {
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) {
      return;
    }

    onClose();
  };

  return (
    <div
      className="subway-selection-guide-backdrop"
      data-testid="subway-selection-guide-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <section aria-label="지하철 역 선정 안내" className="subway-selection-guide">
        <AppVStack align="center" gap="md">
          <AppVStack align="center" gap="sm">
            <AppText align="center" role="supporting" tone="brand">
              서울 지하철 2호선
            </AppText>
            <AppHeading align="center" as="h2" size="md">
              출발역 랜덤 선정
            </AppHeading>
            <AppText align="center" role="dialogBody">
              확인을 누르면 2호선 노선도 위로 열차가
              <br />
              출발하여 탐방지가 선정됩니다.
            </AppText>
          </AppVStack>
          <AppButton disabled={!isCameraReady} onClick={onConfirm} size="lg" variant="primary">
            확인
          </AppButton>
        </AppVStack>
      </section>
    </div>
  );
}
