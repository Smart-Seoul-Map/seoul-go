import { useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement, SyntheticEvent } from "react";

import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton, AppIconButton } from "@shared/ui/button";
import { AppHeading, AppText } from "@shared/ui/typography";

import type { EntryNumberRewardRow } from "../domain/entryNumberReward";
import closeIcon from "../../../assets/icons/close.svg";
import dicesIcon from "../../../assets/icons/dices.svg";

import { EntryCollectedNumbersGuideDialog } from "./EntryCollectedNumbersGuideDialog";

import "./EntryCollectedNumbersPanel.css";

type EntryCollectedNumbersPanelProps = {
  rows: readonly EntryNumberRewardRow[];
  isCharacterMoving?: boolean;
  isDartViewActive?: boolean;
};

type OpenState = "closed" | "open" | "autoOpen";

export function EntryCollectedNumbersPanel({
  rows,
  isCharacterMoving = false,
  isDartViewActive = false,
}: EntryCollectedNumbersPanelProps): ReactElement {
  const [openState, setOpenState] = useState<OpenState>("closed");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(rows.length);
  const [wasCharacterMoving, setWasCharacterMoving] = useState(isCharacterMoving);
  const [wasDartViewActive, setWasDartViewActive] = useState(isDartViewActive);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const isOpen = openState !== "closed";
  const countLabel = `${rows.length}개 획득`;

  if (rows.length !== seenCount) {
    setSeenCount(rows.length);
    if (rows.length > seenCount) setOpenState("autoOpen");
  }
  if (isDartViewActive !== wasDartViewActive) {
    setWasDartViewActive(isDartViewActive);
    if (isDartViewActive && openState === "closed") setOpenState("autoOpen");
  }
  if (isCharacterMoving !== wasCharacterMoving) {
    setWasCharacterMoving(isCharacterMoving);
    if (isCharacterMoving && openState === "autoOpen" && !isDartViewActive) {
      setOpenState("closed");
    }
  }

  const setIsOpen = (open: boolean): void => setOpenState(open ? "open" : "closed");

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const measureTrigger = () => {
      if (trigger.offsetWidth > 0) {
        panel.style.setProperty("--entry-numbers-collapsed-width", `${trigger.offsetWidth}px`);
      }
    };
    measureTrigger();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureTrigger);
    observer?.observe(trigger);
    return () => observer?.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (openState === "open") {
      panelRef.current?.focus({ preventScroll: true });
    } else if (openState === "autoOpen") {
      const list = listRef.current;
      if (list) list.scrollTop = list.scrollHeight;
    } else if (panelRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [openState]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (isNoticeOpen) return;

    event.stopPropagation();
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <>
      <AppBox
        as="section"
        ref={(element) => {
          panelRef.current = element;
        }}
        id={`${id}-panel`}
        aria-labelledby={isOpen ? `${id}-title` : undefined}
        tabIndex={isOpen ? -1 : undefined}
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
        <AppBox as="header" className="entry-collected-numbers-header">
          {isOpen ? (
            <AppBox className="entry-collected-numbers-title">
              <NumbersIcon />
              <AppHeading as="h2" size="sm" id={`${id}-title`}>
                번호
              </AppHeading>
              <button
                type="button"
                className="entry-collected-numbers-notice"
                aria-label="번호 안내"
                aria-haspopup="dialog"
                onClick={() => setIsNoticeOpen(true)}
              >
                !
              </button>
            </AppBox>
          ) : (
            <AppButton
              ref={triggerRef}
              size="md"
              variant="ghost"
              aria-label={`내 번호 열기, ${countLabel}`}
              className="entry-collected-numbers-trigger"
              onClick={() => setIsOpen(true)}
            >
              <NumbersIcon />
              <AppText as="span" role="supporting">
                번호
              </AppText>
            </AppButton>
          )}
          <div className="entry-collected-numbers-close" aria-hidden={!isOpen} inert={!isOpen}>
            <AppIconButton ariaLabel="내 번호 접기" size="nav" onClick={() => setIsOpen(false)}>
              <img src={closeIcon} alt="" width="20" height="20" />
            </AppIconButton>
          </div>
        </AppBox>
        <div
          id={`${id}-content`}
          className="entry-collected-numbers-body"
          aria-hidden={!isOpen}
          inert={!isOpen}
        >
          <div className="entry-collected-numbers-content">
            {rows.length === 0 ? (
              <AppBox px="spacing.4" py="spacing.5" className="entry-collected-numbers-empty">
                <AppText role="supporting" tone="muted">
                  아직 획득한 번호가 없어요.
                </AppText>
              </AppBox>
            ) : (
              <AppBox
                as="ul"
                ref={(element) => {
                  listRef.current = element;
                }}
                aria-label="획득한 숫자"
                tabIndex={0}
                className="entry-collected-numbers-list"
                px="spacing.4"
                py="spacing.1"
              >
                {rows.map((row) => (
                  <AppBox as="li" key={row.key} className="entry-collected-numbers-row">
                    <span className="entry-collected-numbers-place">
                      <AppText as="span" role="supporting">
                        {row.placeName}
                      </AppText>
                    </span>
                    <span aria-hidden="true" className="entry-collected-numbers-separator">
                      |
                    </span>
                    <AppBadge size="number-sm" tone="brand" variant="solid" textPolicy="singleLine">
                      {row.number}
                    </AppBadge>
                  </AppBox>
                ))}
              </AppBox>
            )}
          </div>
        </div>
      </AppBox>
      <EntryCollectedNumbersGuideDialog open={isNoticeOpen} onOpenChange={setIsNoticeOpen} />
    </>
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
