import type { ReactElement } from "react";

import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton, AppIconButton } from "@shared/ui/button";
import { AppStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import closeIcon from "../../../assets/icons/close.svg";
import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";

import "./EntryExplorationDartGuide.css";

const PANEL_SURFACE = {
  bg: "bg.surfacePaper",
  borderColor: "stroke.brand",
  borderWidth: "strokeWidth.surface",
} as const;

export type EntryExplorationDartGuideProps = {
  isVisible: boolean;
  landedResult: EntryExplorationDartThrowResult | null;
  onClose: () => void;
  onRetryThrow: () => void;
  onStartExploration: (result: EntryExplorationDartThrowResult) => void;
};

export function EntryExplorationDartGuide({
  isVisible,
  landedResult,
  onClose,
  onRetryThrow,
  onStartExploration,
}: EntryExplorationDartGuideProps): ReactElement | null {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="entry-exploration-dart-guide">
      <AppBox
        className="entry-exploration-dart-guide__action"
        position="absolute"
        right="spacing.4_5"
        top="spacing.4_5"
      >
        <AppIconButton ariaLabel="격자번호 다트 닫기" size="sm" onClick={onClose}>
          <img src={closeIcon} alt="" width="20" height="20" />
        </AppIconButton>
      </AppBox>

      {landedResult && (
        <DartResultPanel
          onRetryThrow={onRetryThrow}
          onStartExploration={onStartExploration}
          result={landedResult}
        />
      )}
    </div>
  );
}

type DartResultPanelProps = {
  onRetryThrow: () => void;
  onStartExploration: (result: EntryExplorationDartThrowResult) => void;
  result: EntryExplorationDartThrowResult;
};

function DartResultPanel({
  onRetryThrow,
  onStartExploration,
  result,
}: DartResultPanelProps): ReactElement {
  const districtName = getSeoulDistrictById(result.districtId ?? 0)?.name ?? "서울";

  return (
    <div className="entry-exploration-dart-guide__result">
      <AppBox
        {...PANEL_SURFACE}
        as="section"
        borderRadius="radius.5"
        boxShadow="shadow.raised"
        px="spacing.4_5"
        py="spacing.4"
      >
        <AppStack align="start" gap="md">
          <AppBadge size="sm" tone="neutral" variant="outline">
            오늘의 시작점
          </AppBadge>
          <AppText role="supporting">격자 → 자치구</AppText>
          <AppHeading as="h3" size="lg">
            {result.gridNumber} → {districtName}
          </AppHeading>
          <div aria-hidden="true" className="entry-exploration-dart-guide__divider" />
          <AppText role="body">
            이 격자는 {districtName}에 위치해 있어요. <br />
            이곳에서 오늘의 탐방을 시작합니다.
          </AppText>
        </AppStack>
      </AppBox>

      <AppBox asChild className="entry-exploration-dart-guide__action" width="full">
        <AppButton onClick={() => onStartExploration(result)} size="lg" variant="primary">
          {districtName}에서 탐방 시작 →
        </AppButton>
      </AppBox>

      <AppBox
        bg="bg.surfacePaper"
        borderColor="stroke.brand"
        borderRadius="radius.4"
        borderWidth="strokeWidth.surface"
        boxShadow="shadow.raised"
        className="entry-exploration-dart-guide__action"
        width="full"
      >
        <AppButton
          className="entry-exploration-dart-guide__retry"
          onClick={onRetryThrow}
          size="lg"
          variant="ghost"
        >
          다시 추첨하기
          <span aria-hidden="true" className="entry-exploration-dart-guide__retry-icon" />
        </AppButton>
      </AppBox>
    </div>
  );
}
