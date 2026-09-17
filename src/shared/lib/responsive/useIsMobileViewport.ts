import { useSyncExternalStore } from "react";

const subscribeViewport = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const getMobileSnapshot = () => {
  const breakpoint =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--sg-breakpoint-mobile-max")
    ) || 860;
  return window.innerWidth <= breakpoint;
};

export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(subscribeViewport, getMobileSnapshot, () => false);
}
