import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ENTRY_GUIDE_MESSAGES } from "../config/entryGuideMessages";
import { ENTRY_GUIDE_STEPS } from "../config/entryGuideSteps";
import { ENTRY_GUIDE_SEEN_STORAGE_KEY } from "../data/entryGuideStorage";
import { EntryGuideOverlay } from "./EntryGuideOverlay";

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@shared/lib/analytics/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/lib/analytics/analytics")>()),
  track: trackMock,
}));

const STEP_TEXT = ENTRY_GUIDE_MESSAGES.firstEntryGuide.stepText;
const COMPLETED_CLOSE = { name: "entry_guide_close", step: 3, completed: true };
const NUMBERS_GUIDE_BUTTON_CLASS = "entry-collected-numbers-guide-button";
const NUMBERS_TRIGGER_CLASS = "entry-collected-numbers-trigger";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  trackMock.mockClear();
  vi.unstubAllGlobals();
});

function getStepImage(): string | null | undefined {
  return screen.getByRole("dialog").querySelector("img")?.getAttribute("src");
}

function goToStep(step: number): void {
  for (let current = 1; current < step; current += 1) {
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
  }
}

// 내 번호 패널의 "!"·내 번호 버튼처럼 가이드 밖에 있는 버튼을 직접 붙인다.
function appendButton(className: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = className;
  document.body.append(button);
  return button;
}

describe("EntryGuideOverlay", () => {
  test("shows the first step as a modal overlay named by its title with a single 다음 button", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    const heading = screen.getByRole("heading");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(heading.textContent).toBe(STEP_TEXT.moveTitle.replace("{pointerAction}", "클릭"));

    const image = dialog.querySelector("img");
    expect(image?.getAttribute("src")).toBe(ENTRY_GUIDE_STEPS[0].image);
    expect(image?.getAttribute("alt")).toBe("");

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["다음"]);
  });

  test("colors only the [[ ]] words of the tip without showing the markers", () => {
    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);

    const highlight = screen.getByText("장소");
    expect(highlight.tagName).toBe("SPAN");
    expect(highlight.classList.contains("entry-guide-overlay-highlight")).toBe(true);

    const tip = highlight.parentElement;
    expect(tip?.textContent).toBe(STEP_TEXT.moveTip.replace("[[", "").replace("]]", ""));
    expect(tip?.children).toHaveLength(1);
    expect(screen.getByRole("dialog").textContent).not.toMatch(/\[\[|\]\]/);
  });

  test("draws the title and tip in the inverted tone over the dim", () => {
    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);

    const tip = screen.getByText("장소").parentElement;
    expect(screen.getByRole("heading").getAttribute("data-tone")).toBe("inverted");
    expect(tip?.getAttribute("data-tone")).toBe("inverted");
  });

  test.each([
    {
      pointer: "coarse",
      matchMedia: (query: string) => ({ matches: query === "(pointer: coarse)" }),
      action: "터치",
    },
    { pointer: "fine", matchMedia: () => ({ matches: false }), action: "클릭" },
    { pointer: "unknown", matchMedia: undefined, action: "클릭" },
  ])("says $action in the title for a $pointer pointer", ({ matchMedia, action }) => {
    vi.stubGlobal("matchMedia", matchMedia);
    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("heading").textContent).toBe(
      STEP_TEXT.moveTitle.replace("{pointerAction}", action)
    );
  });

  test.each([
    {
      step: 2,
      title: STEP_TEXT.numberTitle,
      tip: STEP_TEXT.numberTip,
      highlight: "모은 줄",
      button: "다음",
    },
    {
      step: 3,
      title: STEP_TEXT.dartTitle,
      tip: STEP_TEXT.dartTip,
      highlight: "자치구",
      button: "확인",
    },
  ])(
    "shows step $step with its title, image, highlighted tip and a single $button button",
    ({ step, title, tip, highlight, button }) => {
      const onOpenChange = vi.fn();
      render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);

      goToStep(step);

      const heading = screen.getByRole("heading");
      expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(heading.id);
      expect(heading.textContent).toBe(title);
      expect(getStepImage()).toBe(ENTRY_GUIDE_STEPS[step - 1].image);
      const highlighted = screen.getByText(highlight);
      expect(highlighted.classList.contains("entry-guide-overlay-highlight")).toBe(true);
      expect(highlighted.parentElement?.textContent).toBe(tip.replace("[[", "").replace("]]", ""));
      expect(screen.getAllByRole("button").map((element) => element.textContent)).toEqual([button]);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(trackMock).not.toHaveBeenCalled();
    }
  );

  test("goes 다음 → 다음 → 확인 and closes only with 확인 on the third step, saving that the guide was seen", () => {
    const onOpenChange = vi.fn();
    render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(localStorage.getItem(ENTRY_GUIDE_SEEN_STORAGE_KEY)).toBe("1");
    expect(trackMock).toHaveBeenCalledExactlyOnceWith(COMPLETED_CLOSE);
  });

  test("stays open when the dim is pressed", () => {
    const onOpenChange = vi.fn();
    render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBe(dialog);
  });

  test("closes with Escape on the last step the same way as 확인 and ignores other keys", () => {
    const onOpenChange = vi.fn();
    render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);
    goToStep(3);

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(localStorage.getItem(ENTRY_GUIDE_SEEN_STORAGE_KEY)).toBe("1");
    expect(trackMock).toHaveBeenCalledExactlyOnceWith(COMPLETED_CLOSE);
  });

  test("moves focus from the scene to the 다음 button when it opens", () => {
    const { rerender } = render(
      <>
        <button>탐방 화면</button>
        <EntryGuideOverlay open={false} onOpenChange={vi.fn()} />
      </>
    );
    screen.getByRole("button", { name: "탐방 화면" }).focus();

    rerender(
      <>
        <button>탐방 화면</button>
        <EntryGuideOverlay open onOpenChange={vi.fn()} />
      </>
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "다음" }));
  });

  test.each([
    { key: "Tab", shiftKey: false },
    { key: "Shift+Tab", shiftKey: true },
  ])(
    "keeps $key on the guide button, brings slipped focus back and lets it go once closed",
    ({ shiftKey }) => {
      const onOpenChange = vi.fn();
      const scene = (open: boolean) => (
        <>
          <button>탐방 화면</button>
          <EntryGuideOverlay open={open} onOpenChange={onOpenChange} />
        </>
      );
      const { rerender } = render(scene(true));
      const guideButton = screen.getByRole("button", { name: "다음" });
      expect(document.activeElement).toBe(guideButton);

      expect(fireEvent.keyDown(guideButton, { key: "Tab", shiftKey })).toBe(false);
      expect(document.activeElement).toBe(guideButton);

      // 토스트처럼 오버레이 위에 뜬 것을 마우스로 눌러 포커스가 밖으로 나간 경우
      const outside = screen.getByRole("button", { name: "탐방 화면" });
      outside.focus();
      expect(fireEvent.keyDown(outside, { key: "Tab", shiftKey })).toBe(false);
      expect(document.activeElement).toBe(guideButton);
      expect(onOpenChange).not.toHaveBeenCalled();

      rerender(scene(false));

      expect(fireEvent.keyDown(document, { key: "Tab", shiftKey })).toBe(true);
    }
  );

  test("returns focus after closing to the element focused before it opened when that is still there", () => {
    appendButton(NUMBERS_GUIDE_BUTTON_CLASS);
    appendButton(NUMBERS_TRIGGER_CLASS);
    const earlier = appendButton("scene-control");
    earlier.focus();
    const { rerender } = render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "다음" }));

    rerender(<EntryGuideOverlay open={false} onOpenChange={vi.fn()} />);

    expect(document.activeElement).toBe(earlier);
  });

  test.each([
    { before: "nothing was focused before it opened", hadEarlierFocus: false },
    { before: "the element focused before it opened is gone", hadEarlierFocus: true },
  ])(
    "returns focus after closing to the ! button of my numbers when $before",
    ({ hadEarlierFocus }) => {
      const numbersGuideButton = appendButton(NUMBERS_GUIDE_BUTTON_CLASS);
      appendButton(NUMBERS_TRIGGER_CLASS);
      const earlier = hadEarlierFocus ? appendButton("scene-control") : null;
      earlier?.focus();
      expect(document.activeElement).toBe(earlier ?? document.body);
      const { rerender } = render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);
      earlier?.remove();

      rerender(<EntryGuideOverlay open={false} onOpenChange={vi.fn()} />);

      expect(document.activeElement).toBe(numbersGuideButton);
    }
  );

  test("returns focus after closing to the my numbers button when there is no ! button", () => {
    const numbersTrigger = appendButton(NUMBERS_TRIGGER_CLASS);
    expect(document.activeElement).toBe(document.body);
    const { rerender } = render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);

    rerender(<EntryGuideOverlay open={false} onOpenChange={vi.fn()} />);

    expect(document.activeElement).toBe(numbersTrigger);
  });

  test("stops wheel and touch scrolling from moving the map behind it", () => {
    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    const button = screen.getByRole("button", { name: "다음" });

    expect(fireEvent.wheel(dialog, { deltaY: 100 })).toBe(false);
    expect(fireEvent.touchMove(dialog)).toBe(false);
    expect(fireEvent.wheel(button, { deltaY: 100 })).toBe(false);
    expect(fireEvent.touchMove(button)).toBe(false);
  });

  test("renders nothing and leaves Escape and Tab alone while closed", () => {
    const onOpenChange = vi.fn();
    render(<EntryGuideOverlay open={false} onOpenChange={onOpenChange} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(true);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });
});
