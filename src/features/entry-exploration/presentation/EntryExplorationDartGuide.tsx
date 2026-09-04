import type { ReactElement } from "react";

import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";
import { AppBadge } from "@shared/ui/badge";
import { AppButton } from "@shared/ui/button";
import { AppStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";

import "./EntryExplorationDartGuide.css";

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
      <section className="entry-exploration-dart-guide__prompt">
        <AppStack align="center" gap="sm">
          <AppHeading align="center" as="h2" size="lg">
            서울 지도에 <span className="entry-exploration-dart-guide__accent">화살을</span> 쏴
            볼까요?
          </AppHeading>
          <AppText align="center" role="supporting">
            명중하면 오늘 탐방을 시작할{" "}
            <span className="entry-exploration-dart-guide__accent">서울의 격자번호</span>가
            정해져요.
          </AppText>
        </AppStack>
      </section>

      {landedResult ? (
        <DartResultPanel onStartExploration={onStartExploration} result={landedResult} />
      ) : null}

      {shotResult ? null : (
        <>
          <section className="entry-exploration-dart-guide__side">
            <AppStack align="start" gap="sm">
              <AppHeading as="h3" size="sm" tone="brand">
                격자번호란?
              </AppHeading>
              <AppText role="supporting">
                서울을 일정한 칸으로 나누고 각 칸에 번호를 부여한 탐방 기준이에요.
              </AppText>
            </AppStack>
          </section>

          <section className="entry-exploration-dart-guide__hint">
            <AppText align="center" role="supporting">
              화살을 클릭해 서울 지도로 쏴보세요!
            </AppText>
          </section>
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
    <section className="entry-exploration-dart-guide__side">
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
        <div className="entry-exploration-dart-guide__action">
          <AppButton onClick={() => onStartExploration(result)} size="md" variant="primary">
            {districtName}에서 탐방 시작
          </AppButton>
        </div>
      </AppStack>
    </section>
  );
}
