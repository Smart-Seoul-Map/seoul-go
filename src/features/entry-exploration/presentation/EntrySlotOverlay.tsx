import { useEffect, useLayoutEffect, useRef, type ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppButton, AppIconButton } from "@shared/ui/button";
import { AppHeading, AppText } from "@shared/ui/typography";

import closeIcon from "../../../assets/close.svg";
import retryIcon from "../../../assets/entry-exploration/icon-sync.svg";
import type { EntrySlotState, EntrySlotViewportBounds } from "../application/entrySlotInteraction";

import "./EntrySlotOverlay.css";

type EntrySlotOverlayProps = {
  state: EntrySlotState;
  onSpin: () => void;
  onClose: () => void;
  onRetryLoad: () => void;
  onViewportBoundsChange: (bounds: EntrySlotViewportBounds | null) => void;
};

export function EntrySlotOverlay({
  state,
  onSpin,
  onClose,
  onRetryLoad,
  onViewportBoundsChange,
}: EntrySlotOverlayProps): ReactElement | null {
  const overlayRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const spinButtonRef = useRef<HTMLButtonElement>(null);
  const isVisible = state.status !== "closed" && state.status !== "loading";
  const isReady = state.status === "ready";
  const isError = state.status === "error";
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const header = headerRef.current;
    const controls = controlsRef.current;
    if (!overlay || !header || !controls) return;
    const measure = () => {
      const viewport = overlay.getBoundingClientRect();
      if (viewport.height <= 0) return;
      const top = (header.getBoundingClientRect().bottom - viewport.top) / viewport.height;
      const bottom = (controls.getBoundingClientRect().top - viewport.top) / viewport.height;
      if (bottom > top) onViewportBoundsChange({ top, bottom });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(overlay);
    observer?.observe(header);
    observer?.observe(controls);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      onViewportBoundsChange(null);
    };
  }, [isVisible, isError, onViewportBoundsChange]);
  useEffect(() => {
    if (isReady) spinButtonRef.current?.focus({ preventScroll: true });
  }, [isReady]);
  useEffect(() => {
    if (!isVisible || isError) return;
    const previousFocus = document.activeElement;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [isVisible, onClose, isError]);
  if (!isVisible) return null;

  if (state.status === "error") {
    return (
      <AppBox className="entry-slot-error" bg="bg.surfacePaper" p="spacing.4" role="alert">
        <AppText>슬롯을 불러오지 못했어요.</AppText>
        <AppButton size="sm" onClick={onRetryLoad}>
          다시 불러오기
        </AppButton>
      </AppBox>
    );
  }

  const result = state.status === "result" ? state.result : null;
  const isSpinning = state.status === "spinning";
  const spinLabel = result ? "다시 돌리기" : "돌리기";

  return (
    <section ref={overlayRef} className="entry-slot-overlay" aria-label="숫자 슬롯">
      <AppBox
        as="header"
        ref={(element) => {
          headerRef.current = element;
        }}
        bg="bg.surfacePaper"
        px="spacing.4"
        py="spacing.3"
        className="entry-slot-header"
      >
        <AppHeading as="h2" size="sm">
          숫자 슬롯
        </AppHeading>
        <AppIconButton ariaLabel="슬롯 닫기" size="sm" onClick={onClose}>
          <img src={closeIcon} alt="" width="20" height="20" />
        </AppIconButton>
      </AppBox>
      <AppBox
        ref={controlsRef}
        bg="bg.surfacePaper"
        borderRadius="radius.2"
        p="spacing.4"
        className="entry-slot-controls"
      >
        <output
          aria-label="뽑힌 숫자"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={isSpinning}
          className="entry-slot-result"
        >
          <AppBadge size="lg" tone="info" variant="solid">
            {result?.[0] ?? "?"}
          </AppBadge>
          <AppBadge size="lg" tone="brand" variant="solid">
            {result?.[1] ?? "?"}
          </AppBadge>
        </output>
        <AppButton
          ref={spinButtonRef}
          variant="primary"
          disabled={state.status === "focusing" || isSpinning}
          onClick={onSpin}
        >
          {result ? <img src={retryIcon} alt="" width="20" height="20" /> : null}
          {isSpinning ? "돌아가는 중" : spinLabel}
        </AppButton>
      </AppBox>
    </section>
  );
}
