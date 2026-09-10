import type { ReactElement, ReactNode } from "react";

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

const CENTERED_COLUMN = {
  position: "absolute",
  left: "50%",
  unstable_transform: "translateX(-50%)",
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
        {...CENTERED_COLUMN}
        as="section"
        borderRadius="radius.7"
        boxShadow="shadow.raised"
        top="spacing.10"
        width="51%"
        px="spacing.9"
        py="spacing.10"
      >
        <AppStack align="center" gap="sm">
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
          <DartSidePanel>
            <AppStack align="start" gap="sm">
              <AppHeading as="h3" size="sm" tone="brand">
                격자번호란?
              </AppHeading>
              <AppText role="supporting">
                서울을 일정한 칸으로 나누고 각 칸에 번호를 부여한 탐방 기준이에요.
              </AppText>
            </AppStack>
          </DartSidePanel>

          <AppBox
            {...PANEL_SURFACE}
            {...CENTERED_COLUMN}
            as="section"
            borderRadius="radius.5_5"
            boxShadow="shadow.1"
            bottom="spacing.10"
            width="29%"
            px="spacing.5_5"
            py="spacing.3_5"
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

type DartSidePanelProps = {
  action?: ReactNode;
  children: ReactNode;
};

function DartSidePanel({ action, children }: DartSidePanelProps): ReactElement {
  return (
    <AppBox
      display="flex"
      flexDirection="column"
      gap="spacing.4"
      position="absolute"
      top="48%"
      right="spacing.10"
      width="18%"
    >
      <AppBox
        {...PANEL_SURFACE}
        as="section"
        borderRadius="radius.5_5"
        boxShadow="shadow.raised"
        p="spacing.4"
      >
        {children}
      </AppBox>
      {action}
    </AppBox>
  );
}

type DartResultPanelProps = {
  onStartExploration: (result: EntryExplorationDartThrowResult) => void;
  result: EntryExplorationDartThrowResult;
};

function DartResultPanel({ onStartExploration, result }: DartResultPanelProps): ReactElement {
  const districtName = getSeoulDistrictById(result.districtId ?? 0)?.name ?? "서울";

  return (
    <DartSidePanel
      action={
        <AppBox asChild className="entry-exploration-dart-guide__action" width="full">
          <AppButton onClick={() => onStartExploration(result)} size="lg" variant="primary">
            {districtName}에서 탐방 시작 →
          </AppButton>
        </AppBox>
      }
    >
      <AppStack align="start" gap="sm">
        <AppBadge tone="brand" variant="weak">
          오늘의 시작점
        </AppBadge>
        <AppHeading as="h3" size="lg" tone="brand">
          {result.gridNumber}
        </AppHeading>
        <hr className="entry-exploration-dart-guide__divider" />
        <AppText role="supporting">
          이 격자는 {districtName}에 위치해 있어요. 이곳에서 오늘의 탐방을 시작합니다.
        </AppText>
      </AppStack>
    </DartSidePanel>
  );
}
