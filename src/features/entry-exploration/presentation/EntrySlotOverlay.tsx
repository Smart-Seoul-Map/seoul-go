import { useEffect, useLayoutEffect, useRef, type ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppIconButton } from "@shared/ui/button";
import { AppHeading, AppText } from "@shared/ui/typography";

import closeIcon from "../../../assets/close.svg";
import type { EntrySlotState, EntrySlotViewportBounds } from "../application/entrySlotInteraction";

import "./EntrySlotOverlay.css";

type EntrySlotOverlayProps = {
  state: EntrySlotState;
  onClose: () => void;
  onViewportBoundsChange: (bounds: EntrySlotViewportBounds | null) => void;
};

export function EntrySlotOverlay({
  state,
  onClose,
  onViewportBoundsChange,
}: EntrySlotOverlayProps): ReactElement | null {
  const overlayRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const isVisible = state.status !== "closed";
  const canClose = state.status === "result";
  const isFallback = state.status === "result" && state.isFallback;
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
  }, [isVisible, onViewportBoundsChange]);
  useEffect(() => {
    if (canClose) headerRef.current?.querySelector("button")?.focus({ preventScroll: true });
    else if (isVisible) overlayRef.current?.focus({ preventScroll: true });
  }, [canClose, isVisible]);
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (canClose) onClose();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const target = canClose ? headerRef.current?.querySelector("button") : overlayRef.current;
        target?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, onClose, canClose]);
  if (!isVisible) return null;

  const result = state.status === "result" ? state.result : null;
  let message = "번호를 확인하고 있어요.";
  if (canClose) message = "내 번호에 추가했어요.";
  if (isFallback) message = "슬롯을 표시하지 못했지만 번호는 받았어요.";

  return (
    <section
      ref={overlayRef}
      tabIndex={-1}
      className="entry-slot-overlay"
      aria-label="숫자 슬롯"
      data-state={state.status}
    >
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
        <AppIconButton ariaLabel="슬롯 닫기" size="sm" disabled={!canClose} onClick={onClose}>
          <img src={closeIcon} alt="" width="20" height="20" />
        </AppIconButton>
      </AppBox>
      <AppBox
        ref={controlsRef}
        bg="bg.surfacePaper"
        borderRadius="radius.2"
        p="spacing.4"
        className="entry-slot-controls"
        role={isFallback ? "alert" : undefined}
      >
        <output
          aria-label="뽑힌 숫자"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={!canClose}
          className="entry-slot-result"
        >
          <AppBadge size="lg" tone="info" variant="solid">
            {result?.[0] ?? "?"}
          </AppBadge>
          <AppBadge size="lg" tone="brand" variant="solid">
            {result?.[1] ?? "?"}
          </AppBadge>
        </output>
        <AppText role="supporting">{message}</AppText>
      </AppBox>
    </section>
  );
}
