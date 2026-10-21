import type { ReactElement } from "react";

import { AppDialog } from "@shared/ui/dialog";
import { AppText } from "@shared/ui/typography";

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
      title={<span className="entry-numbers-guide-title">내 번호</span>}
      closeOnInteractOutside
      onOpenChange={onOpenChange}
      closeAction={{
        ariaLabel: "닫기",
        onClick: () => onOpenChange(false),
        children: <img src={closeIcon} alt="" width="20" height="20" />,
      }}
    >
      <div className="entry-numbers-guide">
        <div className="entry-numbers-guide-hero">
          <img
            src={heroImage}
            alt="서울을 1km의 작은 격자로 나누고, 가로 세로를 지정하기 위해 사용하는 번호예요."
          />
          <div className="entry-numbers-guide-caption">
            <AppText as="span" role="supporting" align="center">
              격자마다 서로 다른 번호를 부여해요.
            </AppText>
          </div>
        </div>
        <section className="entry-numbers-guide-card">
          <span
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
        </section>
        <section className="entry-numbers-guide-card">
          <span
            aria-hidden="true"
            className="entry-numbers-guide-document"
            style={{ maskImage: `url("${documentIcon}")` }}
          />
          <div className="entry-numbers-guide-national">
            <AppText as="span" role="supporting">
              <span className="entry-numbers-guide-link-title">
                실제 국가지점번호도 알아볼까요?
              </span>
            </AppText>
            <AppText as="span" role="supporting" tone="muted">
              국토를 10m 간격의 격자로 구분해 위치를 표시하는 국가 주소정보체계예요.
            </AppText>
          </div>
          <a
            className="entry-numbers-guide-link"
            href={ENTRY_NATIONAL_POINT_LINK.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ENTRY_NATIONAL_POINT_LINK.label}
          >
            <img src={externalLinkIcon} alt="" width="24" height="24" />
          </a>
        </section>
      </div>
    </AppDialog>
  );
}
