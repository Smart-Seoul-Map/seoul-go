import { useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement, SyntheticEvent } from "react";

import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton, AppIconButton } from "@shared/ui/button";
import { AppHStack } from "@shared/ui/layout";
import { AppHeading, AppText } from "@shared/ui/typography";

import closeIcon from "../../../assets/close.svg";
import dicesIcon from "../../../assets/dices.svg";

import "./EntryCollectedNumbersPanel.css";

type EntryCollectedNumbersPanelProps = {
  numbers: readonly number[];
};

export function EntryCollectedNumbersPanel({
  numbers,
}: EntryCollectedNumbersPanelProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const hasOpenedRef = useRef(false);
  const countLabel = `${numbers.length}개 획득`;

  useLayoutEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      panelRef.current?.focus({ preventScroll: true });
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    event.stopPropagation();
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <AppBox
      bg="bg.floating"
      borderRadius="radius.4_5"
      boxShadow="shadow.raised"
      className="entry-collected-numbers"
      data-open={isOpen}
      onClick={stopSceneInput}
      onPointerDown={stopSceneInput}
      onWheel={stopSceneInput}
      onKeyDown={handleKeyDown}
    >
      {isOpen ? (
        <section
          ref={panelRef}
          id={`${id}-panel`}
          aria-labelledby={`${id}-title`}
          tabIndex={-1}
          className="entry-collected-numbers-panel"
        >
          <AppBox
            as="header"
            className="entry-collected-numbers-header"
            px="spacing.4"
            py="spacing.2"
          >
            <AppHStack align="center" gap="sm">
              <NumbersIcon />
              <AppHeading as="h2" size="sm" id={`${id}-title`}>
                내 번호
              </AppHeading>
              <AppBadge size="xs" tone="neutral" variant="weak" ariaLabel={countLabel}>
                {numbers.length}
              </AppBadge>
            </AppHStack>
            <AppIconButton ariaLabel="내 번호 접기" size="nav" onClick={() => setIsOpen(false)}>
              <img src={closeIcon} alt="" width="20" height="20" />
            </AppIconButton>
          </AppBox>
          {numbers.length === 0 ? (
            <AppBox px="spacing.4" py="spacing.5" className="entry-collected-numbers-empty">
              <AppText role="supporting" tone="muted">
                아직 획득한 번호가 없어요.
              </AppText>
            </AppBox>
          ) : (
            <AppBox
              as="ul"
              aria-label="획득한 숫자"
              tabIndex={0}
              className="entry-collected-numbers-list"
              px="spacing.4"
              py="spacing.1"
            >
              {numbers.map((number) => (
                <AppBox as="li" key={number} className="entry-collected-numbers-row">
                  <AppText as="span" role="supporting">
                    추첨 번호
                  </AppText>
                  <AppBadge size="number-sm" tone="info" variant="solid" textPolicy="singleLine">
                    {number}
                  </AppBadge>
                </AppBox>
              ))}
            </AppBox>
          )}
        </section>
      ) : (
        <AppButton
          ref={triggerRef}
          size="md"
          variant="ghost"
          aria-label={`내 번호 열기, ${countLabel}`}
          aria-expanded={false}
          aria-controls={`${id}-panel`}
          title="내 번호"
          className="entry-collected-numbers-trigger"
          onClick={() => setIsOpen(true)}
        >
          <NumbersIcon />
          <span className="entry-collected-numbers-trigger-label">
            <AppText as="span" role="supporting">
              내 번호
            </AppText>
            <AppBadge size="xs" tone="neutral" variant="weak">
              {numbers.length}
            </AppBadge>
          </span>
        </AppButton>
      )}
    </AppBox>
  );
}

function NumbersIcon(): ReactElement {
  return (
    <span
      aria-hidden="true"
      className="entry-collected-numbers-icon"
      style={{ maskImage: `url("${dicesIcon}")` }}
    />
  );
}

function stopSceneInput(event: SyntheticEvent): void {
  event.stopPropagation();
}
