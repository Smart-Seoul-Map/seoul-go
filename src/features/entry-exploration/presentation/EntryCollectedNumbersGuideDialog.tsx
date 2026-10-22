import type { ReactElement } from "react";

import { AppBox } from "@shared/ui/box";
import { AppDialog } from "@shared/ui/dialog";
import { AppVStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import closeIcon from "../../../assets/icons/close.svg";
import compassIcon from "../../../assets/icons/compass.svg";
import documentIcon from "../../../assets/icons/document.svg";
import externalLinkIcon from "../../../assets/icons/external-link.svg";
import heroImage from "../../../assets/entry-exploration/numbers-guide-hero.webp";
import { ENTRY_NATIONAL_POINT_LINK } from "../config/entryNationalPointLink";

import "./EntryCollectedNumbersGuideDialog.css";

type EntryCollectedNumbersGuideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EntryCollectedNumbersGuideDialog({
  open,
  onOpenChange,
}: EntryCollectedNumbersGuideDialogProps): ReactElement {
  return (
    <AppDialog
      open={open}
      title={
        <AppBox as="span" className="entry-numbers-guide-title">
          내 번호
        </AppBox>
      }
      closeOnInteractOutside
      onOpenChange={onOpenChange}
      closeAction={{
        ariaLabel: "닫기",
        onClick: () => onOpenChange(false),
        children: <img src={closeIcon} alt="" width="20" height="20" />,
      }}
    >
      <AppBox className="entry-numbers-guide">
        <AppVStack gap="sm">
          <AppBox className="entry-numbers-guide-hero">
            <img
              src={heroImage}
              alt="서울을 1km의 작은 격자로 나누고, 가로 세로를 지정하기 위해 사용하는 번호예요."
            />
            <AppBox className="entry-numbers-guide-caption">
              <AppText as="span" role="supporting" align="center">
                격자마다 서로 다른 번호를 부여해요.
              </AppText>
            </AppBox>
          </AppBox>
          <AppBox as="section" className="entry-numbers-guide-card">
            <AppBox
              as="span"
              aria-hidden="true"
              className="entry-numbers-guide-badge"
              style={{ backgroundImage: `url("${compassIcon}")` }}
            />
            <AppText>
              <span className="entry-numbers-guide-line">슬롯에서 나온 번호는</span>
              <span className="entry-numbers-guide-line">
                서울탐방GO에서{" "}
                <span className="entry-numbers-guide-accent">탐험할 위치를 찾는 단서</span>예요!
              </span>
            </AppText>
          </AppBox>
          <AppBox as="section" className="entry-numbers-guide-card">
            <AppBox
              as="span"
              aria-hidden="true"
              className="entry-numbers-guide-document"
              style={{ maskImage: `url("${documentIcon}")` }}
            />
            <AppBox className="entry-numbers-guide-national">
              <AppVStack>
                <AppHeading as="h3" size="sm" tone="brand">
                  실제 국가지점번호도 알아볼까요?
                </AppHeading>
                <AppText as="span" role="supporting" tone="muted">
                  국토를 10m 간격의 격자로 구분해 위치를 표시하는 국가 주소정보체계예요.
                </AppText>
              </AppVStack>
            </AppBox>
            <a
              className="entry-numbers-guide-link"
              href={ENTRY_NATIONAL_POINT_LINK.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ENTRY_NATIONAL_POINT_LINK.label}
            >
              <img src={externalLinkIcon} alt="" width="24" height="24" />
            </a>
          </AppBox>
        </AppVStack>
      </AppBox>
    </AppDialog>
  );
}
