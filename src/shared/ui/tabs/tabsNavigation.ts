import type { AppTabsOrientation } from "./tabsContext";

export function getNextTabIndex(
  key: string,
  index: number,
  count: number,
  orientation: AppTabsOrientation,
  isRtl = false
): number | undefined {
  if (count === 0 || index < 0) return undefined;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;

  const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
  const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
  const direction = orientation === "horizontal" && isRtl ? -1 : 1;
  if (key === previousKey) return (index - direction + count) % count;
  if (key === nextKey) return (index + direction + count) % count;

  return undefined;
}

export function revealTab(trigger: HTMLButtonElement): void {
  const list = trigger.closest<HTMLElement>("[role='tablist']");
  if (!list) return;

  const itemRect = trigger.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  const styles = getComputedStyle(list);
  const isVertical = list.getAttribute("aria-orientation") === "vertical";
  const padding =
    Number.parseFloat(isVertical ? styles.scrollPaddingTop : styles.scrollPaddingLeft) || 0;
  const start = isVertical ? itemRect.top - listRect.top : itemRect.left - listRect.left;
  const end = isVertical ? itemRect.bottom - listRect.bottom : itemRect.right - listRect.right;
  let delta = 0;
  if (start < padding) delta = start - padding;
  else if (end > -padding) delta = end + padding;

  // Only move the tab strip, never the surrounding map panel or page.
  if (isVertical) list.scrollTop += delta;
  else list.scrollLeft += delta;
}
