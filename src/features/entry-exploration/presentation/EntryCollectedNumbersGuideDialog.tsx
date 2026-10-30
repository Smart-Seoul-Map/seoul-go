import { useState, type ReactElement } from "react";

import { track } from "@shared/lib/analytics/analytics";
import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";
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
const LAST_STEP = MESSAGES.steps.length - 1;

type EntryCollectedNumbersGuideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 장소 방문 → 번호 획득 → 번호 줄에 다트 순서로 안내한다. 첫 진입에 자동으로 열리고 내 번호의 "!"로 다시 연다.
export function EntryCollectedNumbersGuideDialog({
  open,
  onOpenChange,
}: EntryCollectedNumbersGuideDialogProps): ReactElement {
  const [step, setStep] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep(0);
  }

  const close = (): void => {
    track({ name: "entry_guide_close", step: step + 1, completed: step === LAST_STEP });
    onOpenChange(false);
  };
  const currentStep = MESSAGES.steps[step];

  return (
    <AppDialog
      open={open}
      title={
        <AppBox as="span" className="entry-numbers-guide-title">
          {MESSAGES.title}
        </AppBox>
      }
      closeOnInteractOutside
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
      closeAction={{
        ariaLabel: "닫기",
        onClick: close,
        children: <img src={closeIcon} alt="" width="28" height="28" />,
      }}
      actions={
        <>
          {step > 0 && (
            <AppButton variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
              {MESSAGES.previous}
            </AppButton>
          )}
          {step < LAST_STEP ? (
            <AppButton variant="primary" size="lg" onClick={() => setStep(step + 1)}>
              {MESSAGES.next}
            </AppButton>
          ) : (
            <AppButton variant="primary" size="lg" onClick={close}>
              {MESSAGES.finish}
            </AppButton>
          )}
        </>
      }
    >
      <AppBox className="entry-numbers-guide">
        <AppVStack gap="sm">
          <AppBox as="header" className="entry-numbers-guide-step">
            <ol className="entry-numbers-guide-progress" aria-label="안내 단계">
              {MESSAGES.steps.map((item, index) => (
                <li
                  key={item.title}
                  aria-current={index === step ? "step" : undefined}
                  data-done={index < step || undefined}
                >
                  {index + 1}
                </li>
              ))}
            </ol>
            <AppHeading as="h3" size="sm">
              {currentStep.title}
            </AppHeading>
            <AppText role="supporting" tone="muted">
              {currentStep.description}
            </AppText>
          </AppBox>
          {step === 1 && <NumberStepContent />}
          {step === LAST_STEP && (
            <AppBox {...GUIDE_CARD} as="section">
              <GuideBadge />
              <AppText role="supporting">{MESSAGES.lineTip}</AppText>
            </AppBox>
          )}
        </AppVStack>
      </AppBox>
    </AppDialog>
  );
}

function GuideBadge(): ReactElement {
  return (
    <AppBox
      as="span"
      aria-hidden="true"
      className="entry-numbers-guide-badge"
      style={{ backgroundImage: `url("${compassIcon}")` }}
    />
  );
}

function NumberStepContent(): ReactElement {
  return (
    <>
      <AppBox className="entry-numbers-guide-hero">
        <img src={heroImage} alt={MESSAGES.heroAlt} width="676" height="664" />
        <AppBox className="entry-numbers-guide-caption">
          <AppText as="span" role="supporting" align="center">
            {MESSAGES.heroCaption}
          </AppText>
        </AppBox>
      </AppBox>
      <AppBox {...GUIDE_CARD} as="section">
        <GuideBadge />
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
    </>
  );
}
