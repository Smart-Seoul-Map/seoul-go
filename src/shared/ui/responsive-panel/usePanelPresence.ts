import { useEffect, useState, type RefObject } from "react";

export function usePanelPresence(
  open: boolean,
  skipAnimation: boolean,
  contentRef: RefObject<HTMLElement | null>
) {
  const [retained, setRetained] = useState(open);
  const present = open || (retained && !skipAnimation);
  useEffect(() => {
    if (open) {
      setRetained(true);
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
  }, [open, retained, skipAnimation, contentRef]);
  return {
    present,
    finishExit: () => {
      if (!open) setRetained(false);
    },
  };
}
