import { useEffect, useState, type RefObject } from "react";

export function usePanelPresence(
  open: boolean,
  skipAnimation: boolean,
  contentRef: RefObject<HTMLElement | null>,
  options: { lazyMount?: boolean; unmountOnExit?: boolean } = {}
) {
  const { lazyMount = true, unmountOnExit = true } = options;
  const [hasOpened, setHasOpened] = useState(open);
  const [retained, setRetained] = useState(open || !lazyMount);
  const present = open || (unmountOnExit ? retained && !skipAnimation : retained);
  useEffect(() => {
    if (open) {
      setHasOpened(true);
      setRetained(true);
      return;
    }
    if (!unmountOnExit) return;
    if (lazyMount && !hasOpened) {
      setRetained(false);
      return;
    }
    if (!retained) return;
    const animation = contentRef.current
      ? getComputedStyle(contentRef.current).animationDuration
      : "0s";
    const durations = animation
      .split(",")
      .map((part) => parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000));
    const duration = Math.max(0, ...durations.filter(Number.isFinite));
    const timer = window.setTimeout(() => setRetained(false), skipAnimation ? 0 : duration);
    return () => window.clearTimeout(timer);
  }, [contentRef, hasOpened, lazyMount, open, retained, skipAnimation, unmountOnExit]);
  return {
    present,
    finishExit: () => {
      if (!open && unmountOnExit) setRetained(false);
    },
  };
}
