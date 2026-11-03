import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ENTRY_GUIDE_SEEN_STORAGE_KEY } from "../data/entryGuideStorage";
import { EntryGuideOverlay } from "./EntryGuideOverlay";

// 단계 데이터가 늘어나도 공통 틀의 단계 이동은 그대로 확인하도록 테스트용 2단계 데이터로 고정한다.
const { trackMock, testSteps } = vi.hoisted(() => ({
  trackMock: vi.fn(),
  testSteps: [
    { id: "move", image: "/guide-step1-test.png", title: "moveTitle", tip: "moveTip" },
    { id: "number", image: "/guide-step2-test.png", title: "moveTitle", tip: "moveTip" },
  ],
}));
vi.mock("@shared/lib/analytics/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/lib/analytics/analytics")>()),
  track: trackMock,
}));
vi.mock("../config/entryGuideSteps", () => ({ ENTRY_GUIDE_STEPS: testSteps }));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  trackMock.mockClear();
  vi.unstubAllGlobals();
});

function getStepImage(): string | null | undefined {
  return screen.getByRole("dialog").querySelector("img")?.getAttribute("src");
}

describe("EntryGuideOverlay steps", () => {
  test("goes to the next step with 다음 and closes with 확인 on the last step", () => {
    const onOpenChange = vi.fn();
    render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);
    expect(getStepImage()).toBe(testSteps[0].image);

    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(getStepImage()).toBe(testSteps[1].image);
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(localStorage.getItem(ENTRY_GUIDE_SEEN_STORAGE_KEY)).toBe("1");
    expect(trackMock).toHaveBeenCalledExactlyOnceWith({
      name: "entry_guide_close",
      step: 2,
      completed: true,
    });
  });

  test("moves focus back to the button when the step changes", () => {
    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);
    const button = screen.getByRole("button", { name: "다음" });
    button.blur();
    expect(document.activeElement).not.toBe(button);

    fireEvent.click(button);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "확인" }));
  });

  test("starts again from the first step when it opens again", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(getStepImage()).toBe(testSteps[1].image);

    rerender(<EntryGuideOverlay open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).not.toHaveBeenCalled();

    rerender(<EntryGuideOverlay open onOpenChange={onOpenChange} />);

    expect(getStepImage()).toBe(testSteps[0].image);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "다음" }));
  });

  test("closes with Escape before the last step, still saves that the guide was seen and records an unfinished close", () => {
    const onOpenChange = vi.fn();
    render(<EntryGuideOverlay open onOpenChange={onOpenChange} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(localStorage.getItem(ENTRY_GUIDE_SEEN_STORAGE_KEY)).toBe("1");
    expect(trackMock).toHaveBeenCalledExactlyOnceWith({
      name: "entry_guide_close",
      step: 1,
      completed: false,
    });
  });

  test("preloads every step image when it opens", () => {
    const preloaded: string[] = [];
    vi.stubGlobal(
      "Image",
      class {
        set src(value: string) {
          preloaded.push(value);
        }
      }
    );

    render(<EntryGuideOverlay open onOpenChange={vi.fn()} />);

    expect(preloaded).toEqual(testSteps.map((step) => step.image));
  });
});
