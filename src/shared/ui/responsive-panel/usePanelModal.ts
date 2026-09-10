import { useLayoutEffect, useRef, type RefObject } from "react";

type PanelLayer = { id: string; parentId: string | null; content: HTMLElement; modal: boolean };
const layers: PanelLayer[] = [];
const hiddenElements = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
let bodyStyle: { overflow: string; paddingRight: string } | null = null;

function syncModalEnvironment(): void {
  layers.forEach((layer, index) =>
    layer.content.parentElement?.style.setProperty("--panel-stack-index", String(index))
  );
  for (const [element, previous] of hiddenElements) {
    element.inert = previous.inert;
    if (previous.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", previous.ariaHidden);
  }
  hiddenElements.clear();
  const modal = [...layers].reverse().find((layer) => layer.modal);
  if (!modal) {
    if (bodyStyle) Object.assign(document.body.style, bodyStyle);
    bodyStyle = null;
    return;
  }
  if (!bodyStyle) {
    bodyStyle = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollbar =
      document.documentElement.clientWidth > 0
        ? window.innerWidth - document.documentElement.clientWidth
        : 0;
    if (scrollbar > 0)
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight || "0") + scrollbar}px`;
    document.body.style.overflow = "hidden";
  }
  for (const child of document.body.children) {
    if (!(child instanceof HTMLElement) || child.contains(modal.content)) continue;
    // Keep panels above the active modal interactive, including non-modal child panels.
    if (layers.slice(layers.indexOf(modal) + 1).some((layer) => child.contains(layer.content)))
      continue;
    hiddenElements.set(child, {
      inert: child.inert ?? false,
      ariaHidden: child.getAttribute("aria-hidden"),
    });
    child.inert = true;
    child.setAttribute("aria-hidden", "true");
  }
}

function getFocusableElements(content: HTMLElement): HTMLElement[] {
  return Array.from(
    content.querySelectorAll<HTMLElement>(
      "button, a[href], input, select, textarea, [tabindex], [contenteditable='true']"
    )
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest("[hidden], [inert]") &&
      getComputedStyle(element).display !== "none" &&
      getComputedStyle(element).visibility !== "hidden"
  );
}

type PanelModalOptions = {
  id: string;
  parentId: string | null;
  active: boolean;
  modal: boolean;
  dismissible: boolean;
  contentRef: RefObject<HTMLElement | null>;
  onEscape: () => void;
};

export function usePanelModal({
  id,
  parentId,
  active,
  modal,
  dismissible,
  contentRef,
  onEscape,
}: PanelModalOptions): void {
  const callbacks = useRef({ dismissible, onEscape });
  useLayoutEffect(() => {
    callbacks.current = { dismissible, onEscape };
  });

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!active || !content) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const layer = { id, parentId, content, modal };
    // Child layout effects can run first when nested panels start open together.
    const childIndex = layers.findIndex((candidate) => candidate.parentId === id);
    layers.splice(childIndex < 0 ? layers.length : childIndex, 0, layer);
    const focusFirst = () =>
      (getFocusableElements(content)[0] ?? content).focus({ preventScroll: true });
    if (layers.at(-1)?.id === id) focusFirst();
    syncModalEnvironment();
    const observer = new MutationObserver(syncModalEnvironment);
    observer.observe(document.body, { childList: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (layers.at(-1)?.id !== id) return;
      if (event.key === "Escape" && callbacks.current.dismissible) {
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.current.onEscape();
        return;
      }
      if (event.key !== "Tab" || !modal) return;
      const elements = getFocusableElements(content);
      const first = elements[0] ?? content;
      const last = elements.at(-1) ?? content;
      const focusOutside =
        !content.contains(document.activeElement) || document.activeElement === content;
      if (event.shiftKey && (document.activeElement === first || focusOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusOutside)) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleFocus = (event: FocusEvent) => {
      if (
        modal &&
        layers.at(-1)?.id === id &&
        event.target instanceof Node &&
        !content.contains(event.target)
      )
        focusFirst();
    };
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocus);
      const wasTop = layers.at(-1)?.id === id;
      layers.splice(layers.indexOf(layer), 1);
      syncModalEnvironment();
      if (wasTop && previousFocus?.isConnected && !previousFocus.closest("[inert]"))
        previousFocus.focus({ preventScroll: true });
    };
  }, [active, contentRef, id, modal, parentId]);
}
