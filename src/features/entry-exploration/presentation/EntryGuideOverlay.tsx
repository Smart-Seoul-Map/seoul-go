import { Fragment, useEffect, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

import { track } from "@shared/lib/analytics/analytics";
import { AppButton } from "@shared/ui/button";
import { AppVStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import { ENTRY_GUIDE_MESSAGES } from "../config/entryGuideMessages";
import { ENTRY_GUIDE_STEPS } from "../config/entryGuideSteps";
import { markEntryGuideSeen } from "../data/entryGuideStorage";
import { splitEntryGuideHighlights } from "../domain/entryGuideText";

import "./EntryGuideOverlay.css";

const MESSAGES = ENTRY_GUIDE_MESSAGES.firstEntryGuide;
const LAST_STEP = ENTRY_GUIDE_STEPS.length - 1;
// 열기 전 포커스 자리가 없을 때 돌아갈 곳. 내 번호 패널의 "!"(패널이 열려 있을 때만 있음), 그다음 내 번호 버튼.
const FOCUS_RETURN_FALLBACK_SELECTORS = [
  ".entry-collected-numbers-guide-button",
  ".entry-collected-numbers-trigger",
] as const;

type EntryGuideOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 첫 진입 가이드를 전체 화면 오버레이로 한 단계씩 보여 준다. 방문마다 해치가 처음 멈출 때 열린다.
export function EntryGuideOverlay({
  open,
  onOpenChange,
}: EntryGuideOverlayProps): ReactElement | null {
  const [step, setStep] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep(0);
  }

  const isLastStep = step === LAST_STEP;
  // '봤음'은 열 때 이미 저장하지만 닫을 때도 같은 값을 한 번 더 남긴다.
  const close = (): void => {
    track({ name: "entry_guide_close", step: step + 1, completed: isLastStep });
    markEntryGuideSeen();
    onOpenChange(false);
  };
  const handleStepButtonClick = (): void => {
    if (isLastStep) {
      close();
      return;
    }
    setStep(step + 1);
  };

  useEffect(() => {
    if (open) preloadStepImages();
  }, [open]);

  // 버튼으로 포커스를 옮기기 전에 원래 자리를 기억해 두고, 닫히면 그곳으로 돌려준다.
  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;

    return () => restoreFocus(previousFocus);
  }, [open]);

  useEffect(() => {
    if (open) buttonRef.current?.focus();
  }, [open, step]);

  // PC는 ESC로 닫는다. 마지막 단계의 '확인'과 같은 처리다.
  // 포커스할 곳이 버튼 하나뿐이라 Tab은 버튼에 붙잡아 두어 가이드 밖으로 나가지 않게 한다.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        event.preventDefault();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  // React의 wheel·touchmove 핸들러는 passive라 기본 동작을 못 막아서 직접 붙인다.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!open || !overlay) return;

    overlay.addEventListener("wheel", preventBackgroundGesture, { passive: false });
    overlay.addEventListener("touchmove", preventBackgroundGesture, { passive: false });

    return () => {
      overlay.removeEventListener("wheel", preventBackgroundGesture);
      overlay.removeEventListener("touchmove", preventBackgroundGesture);
    };
  }, [open]);

  if (!open) return null;

  const currentStep = ENTRY_GUIDE_STEPS[step];
  const title = MESSAGES.stepText[currentStep.title].replace("{pointerAction}", getPointerAction());

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="entry-guide-overlay"
    >
      <div className="entry-guide-overlay-stage">
        <AppVStack align="stretch" gap="xl">
          <div
            key={currentStep.id}
            className="entry-guide-overlay-content"
            data-fade={step > 0 || undefined}
          >
            <AppVStack align="center" gap="xl">
              <img
                className="entry-guide-overlay-image"
                src={currentStep.image}
                alt=""
                width="138"
                height="111"
              />
              <AppHeading align="center" as="h2" id={titleId} size="lg" tone="inverted">
                {title}
              </AppHeading>
              <AppText align="center" role="supporting" tone="inverted">
                <GuideHighlightedText text={MESSAGES.stepText[currentStep.tip]} />
              </AppText>
            </AppVStack>
          </div>
          <AppButton
            ref={buttonRef}
            className="entry-guide-overlay-button"
            onClick={handleStepButtonClick}
            size="md"
            variant="primary"
          >
            {isLastStep ? MESSAGES.confirm : MESSAGES.next}
          </AppButton>
        </AppVStack>
      </div>
    </div>,
    document.body
  );
}

function GuideHighlightedText({ text }: { text: string }): ReactElement {
  return (
    <>
      {splitEntryGuideHighlights(text).map((segment, index) =>
        segment.isHighlighted ? (
          <span key={index} className="entry-guide-overlay-highlight">
            {segment.text}
          </span>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </>
  );
}

// 터치가 주 입력인 기기에서는 제목의 "클릭"을 "터치"로 바꾼다.
function getPointerAction(): string {
  const isCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;

  return isCoarsePointer ? MESSAGES.pointerAction.touch : MESSAGES.pointerAction.mouse;
}

// 단계를 넘길 때 그림이 늦게 뜨지 않도록 열릴 때 모든 단계 그림을 미리 받아 둔다.
function preloadStepImages(): void {
  ENTRY_GUIDE_STEPS.forEach((guideStep) => {
    new Image().src = guideStep.image;
  });
}

// 열기 전 포커스가 아직 화면에 있으면 그곳으로, 아니면 내 번호 패널의 버튼으로 돌려준다.
function restoreFocus(previousFocus: Element | null): void {
  const fallbacks = FOCUS_RETURN_FALLBACK_SELECTORS.map((selector) =>
    document.querySelector(selector)
  );
  const target = [previousFocus, ...fallbacks].find(isFocusReturnTarget);

  target?.focus({ preventScroll: true });
}

function isFocusReturnTarget(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element !== document.body && element.isConnected;
}

function preventBackgroundGesture(event: Event): void {
  event.preventDefault();
}
