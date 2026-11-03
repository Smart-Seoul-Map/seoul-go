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
import { ENTRY_GUIDE_MESSAGES } from "../config/entryGuideMessages";
import { ENTRY_NATIONAL_POINT_LINK } from "../config/entryNationalPointLink";

import "./EntryCollectedNumbersGuideDialog.css";

const GUIDE_CARD = {
  display: "flex",
  alignItems: "center",
  gap: "spacing.3",
  px: "spacing.4",
  py: "spacing.3",
  bg: "bg.brandWeak",
  borderColor: "stroke.brandWeak",
  borderWidth: 1,
  borderRadius: "radius.4",
} as const;

const MESSAGES = ENTRY_GUIDE_MESSAGES.numberGuide;

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
          {MESSAGES.title}
        </AppBox>
      }
      closeOnInteractOutside
      onOpenChange={onOpenChange}
      closeAction={{
        ariaLabel: "닫기",
        onClick: () => onOpenChange(false),
        children: <img src={closeIcon} alt="" width="28" height="28" />,
      }}
    >
      <AppBox className="entry-numbers-guide">
        <AppVStack gap="sm">
          <AppBox className="entry-numbers-guide-hero">
            <img src={heroImage} alt={MESSAGES.heroAlt} width="676" height="664" />
            <AppBox className="entry-numbers-guide-caption">
              <AppText as="span" role="supporting" align="center">
                {MESSAGES.heroCaption}
              </AppText>
            </AppBox>
          </AppBox>
          <AppBox {...GUIDE_CARD} as="section">
            <AppBox
              as="span"
              aria-hidden="true"
              className="entry-numbers-guide-badge"
              style={{ backgroundImage: `url("${compassIcon}")` }}
            />
            <AppText>
              <span className="entry-numbers-guide-line">{MESSAGES.clueLead}</span>
              <span className="entry-numbers-guide-line">
                {MESSAGES.cluePrefix}
                <span className="entry-numbers-guide-accent">{MESSAGES.clueAccent}</span>
                {MESSAGES.clueSuffix}
              </span>
            </AppText>
          </AppBox>
          <AppBox {...GUIDE_CARD} as="section">
            <AppBox
              as="span"
              aria-hidden="true"
              className="entry-numbers-guide-document"
              style={{ maskImage: `url("${documentIcon}")` }}
            />
            <AppBox className="entry-numbers-guide-national">
              <AppVStack>
                <AppHeading as="h3" size="sm" tone="brand">
                  {MESSAGES.nationalPointTitle}
                </AppHeading>
                <AppText as="span" role="supporting" tone="muted">
                  {MESSAGES.nationalPointDescription}
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
