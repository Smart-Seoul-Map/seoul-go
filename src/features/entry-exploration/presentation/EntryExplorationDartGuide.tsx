import type { ReactElement } from "react";

import { AppStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import "./EntryExplorationDartGuide.css";

export type EntryExplorationDartGuideProps = {
  isVisible: boolean;
};

export function EntryExplorationDartGuide({
  isVisible,
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

      <section className="entry-exploration-dart-guide__info">
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
    </div>
  );
}
