import "@testing-library/jest-dom/vitest";
import { type ReactElement } from "react";
import { cleanup, fireEvent, render as renderUi, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AppToastProvider } from "@shared/ui/toast";

import { stampCourseStore } from "../application/useStampCourseStore";
import { StampCoursePanel } from "./StampCoursePanel";

const { toBlobMock } = vi.hoisted(() => ({ toBlobMock: vi.fn() }));

vi.mock("html-to-image", () => ({ toBlob: toBlobMock }));

const originalWidth = window.innerWidth;
const clickedDownloads: string[] = [];

function render(ui: ReactElement) {
  return renderUi(ui, { wrapper: AppToastProvider });
}

function savePlace(): void {
  stampCourseStore.getState().addPlace({
    id: "place-0",
    name: "저장된 장소 1",
    themeId: "theme",
    position: { lat: 37.5, lng: 127 },
  });
}

async function clickDownloadImage(): Promise<void> {
  fireEvent.click(await screen.findByRole("button", { name: "이미지 저장" }));
}

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  stampCourseStore.getState().clearPlaces();
  clickedDownloads.length = 0;
  toBlobMock.mockReset();
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: () => "blob:stamp-course",
    revokeObjectURL: () => undefined,
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    clickedDownloads.push(this.download);
  });
});

afterEach(() => {
  cleanup();
  stampCourseStore.getState().clearPlaces();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("이미지 저장은 캡처한 블롭을 날짜 파일명으로 내려받는다", async () => {
  savePlace();
  toBlobMock.mockResolvedValue(new Blob(["stamp"], { type: "image/png" }));
  render(<StampCoursePanel onClose={vi.fn()} />);

  await clickDownloadImage();

  await waitFor(() => expect(clickedDownloads).toHaveLength(1));
  expect(clickedDownloads[0]).toMatch(/^seoul-go-stamp-course-\d{8}\.png$/);
  expect(await screen.findByText("코스 이미지를 저장했어요")).toBeInTheDocument();
});

test("캡처가 실패하면 내려받지 않고 실패 토스트를 띄운다", async () => {
  savePlace();
  toBlobMock.mockRejectedValue(new Error("capture failed"));
  render(<StampCoursePanel onClose={vi.fn()} />);

  await clickDownloadImage();

  expect(await screen.findByText("이미지를 저장하지 못했어요")).toBeInTheDocument();
  expect(clickedDownloads).toHaveLength(0);
});
