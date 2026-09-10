import type { ReactElement } from "react";

import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
import { AppStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";

import "./EntryExplorationDartGuide.css";

const PANEL_SURFACE = {
  bg: "bg.surfacePaper",
  borderColor: "stroke.brand",
  borderWidth: "strokeWidth.surface",
} as const;

export type EntryExplorationDartGuideProps = {
  onStartExploration: (result: EntryExplorationDartThrowResult) => void;
  isVisible: boolean;
  landedResult: EntryExplorationDartThrowResult | null;
  shotResult: EntryExplorationDartThrowResult | null;
};

export function EntryExplorationDartGuide({
  isVisible,
  landedResult,
  onStartExploration,
  shotResult,
}: EntryExplorationDartGuideProps): ReactElement | null {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="entry-exploration-dart-guide">
      <AppBox
        {...PANEL_SURFACE}
        as="section"
        borderRadius="radius.4_5"
        className="entry-exploration-dart-guide__intro"
        px={{ base: "spacing.4_5", md: "spacing.9" }}
        pt={{ base: "spacing.4", md: "spacing.10" }}
        pb={{ base: "spacing.3", md: "spacing.10" }}
      >
        <AppStack align="start" gap="xs">
          <h2 className="entry-exploration-dart-guide__title">
            서울 지도에 <span className="entry-exploration-dart-guide__accent">화살을</span> 쏴
            볼까요?
          </h2>
          <p className="entry-exploration-dart-guide__subtitle">
            명중하면 오늘 탐방을 시작할{" "}
            <span className="entry-exploration-dart-guide__accent">서울의 격자번호</span>가
            정해져요.
          </p>
        </AppStack>
      </AppBox>

      {landedResult ? (
        <DartResultPanel onStartExploration={onStartExploration} result={landedResult} />
      ) : null}

      {shotResult ? null : (
        <>
          <AppBox
            {...PANEL_SURFACE}
            as="section"
            borderRadius="radius.4_5"
            boxShadow="shadow.raised"
            className="entry-exploration-dart-guide__note"
            px="spacing.4_5"
            py="spacing.4"
          >
            <AppStack align="start" gap="xs">
              <AppHeading as="h3" size="sm" tone="brand">
                격자번호란?
              </AppHeading>
              <p className="entry-exploration-dart-guide__subtitle">
                서울을 일정한 칸으로 나누고 각 칸에 번호를 부여한 탐방 기준이에요.
              </p>
            </AppStack>
          </AppBox>

          <AppBox
            {...PANEL_SURFACE}
            as="section"
            borderRadius="radius.4_5"
            boxShadow="shadow.1"
            className="entry-exploration-dart-guide__hint"
            px="spacing.4_5"
            py="spacing.3"
          >
            <AppText align="center" role="supporting">
              화살을 클릭해 서울 지도로 쏴보세요!
            </AppText>
          </AppBox>
        </>
      )}
    </div>
  );
}

type DartResultPanelProps = {
  onStartExploration: (result: EntryExplorationDartThrowResult) => void;
  result: EntryExplorationDartThrowResult;
};

function DartResultPanel({ onStartExploration, result }: DartResultPanelProps): ReactElement {
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
          <AppBadge tone="neutral" variant="outline">
            오늘의 시작점
          </AppBadge>
          <p className="entry-exploration-dart-guide__result-caption">격자 → 자치구</p>
          <p className="entry-exploration-dart-guide__headline">
            {result.gridNumber} → {districtName}
          </p>
          <p className="entry-exploration-dart-guide__result-note">
            {result.gridNumber}번 격자가 {districtName} 영역에 연결되었습니다.
          </p>
          <p className="entry-exploration-dart-guide__result-emphasis">
            이곳에서 오늘의 탐방을 시작합니다.
          </p>
        </AppStack>
      </AppBox>

      <AppBox asChild className="entry-exploration-dart-guide__action" width="full">
        <AppButton onClick={() => onStartExploration(result)} size="lg" variant="primary">
          {districtName}에서 탐방 시작 →
        </AppButton>
      </AppBox>
    </div>
  );
}
