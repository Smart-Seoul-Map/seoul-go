import "@testing-library/jest-dom/vitest";
import { type ReactElement } from "react";
import { cleanup, fireEvent, render as renderUi, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AppToastProvider } from "@shared/ui/toast";
import { kyClient } from "@shared/lib/http/kyClient";

import { stampCourseStore } from "../application/useStampCourseStore";
import { StampCoursePanel } from "./StampCoursePanel";

const { toBlobMock } = vi.hoisted(() => ({ toBlobMock: vi.fn() }));

vi.mock("html-to-image", () => ({ toBlob: toBlobMock }));

const originalWidth = window.innerWidth;
const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "decode");
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
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  stampCourseStore.getState().clearPlaces();
  clickedDownloads.length = 0;
  toBlobMock.mockReset();
  toBlobMock.mockResolvedValue(new Blob(["stamp"], { type: "image/png" }));
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL() {
        return "blob:stamp-course";
      }
      static revokeObjectURL() {
        return undefined;
      }
    }
  );
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
  if (originalDecode) {
    Object.defineProperty(HTMLImageElement.prototype, "decode", originalDecode);
  } else {
    Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
  }
});

test("이미지 저장은 캡처한 블롭을 날짜 파일명으로 내려받는다", async () => {
  savePlace();
  toBlobMock.mockResolvedValue(new Blob(["stamp"], { type: "image/png" }));
  render(<StampCoursePanel onClose={vi.fn()} />);

  await clickDownloadImage();

  await waitFor(() => expect(clickedDownloads).toHaveLength(1));
  expect(clickedDownloads[0]).toMatch(/^seoul-go-stamp-course-\d{8}\.png$/);
  expect(toBlobMock).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({ includeQueryParams: true })
  );
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

test("표시에는 요청하지 않고 저장 복사본에만 프록시 사진을 넣으며 이후 정리한다", async () => {
  const imageUrl = "https://img.daum-kg.net/photo.png?version=2";
  stampCourseStore.getState().addPlace({
    id: "photo",
    name: "Photo",
    themeId: "theme",
    imageUrl,
    position: { lat: 37.5, lng: 127 },
  });
  const get = vi.spyOn(kyClient, "get").mockReturnValue(
    Promise.resolve(
      new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { "Content-Type": "image/png" },
      })
    ) as ReturnType<typeof kyClient.get>
  );
  render(<StampCoursePanel onClose={vi.fn()} />);
  const source = document.querySelector(".StampCourseBoardFrame")!;
  expect(get).not.toHaveBeenCalled();
  toBlobMock.mockImplementation(async (clone: HTMLElement) => {
    expect(clone).not.toBe(source);
    expect(clone.querySelector("img")?.src).toBe("data:image/png;base64,iVBORw==");
    expect(source.querySelector("img")?.src).toBe(imageUrl);
    return new Blob(["png"], { type: "image/png" });
  });
  await clickDownloadImage();
  await waitFor(() => expect(clickedDownloads).toHaveLength(1));
  expect(get).toHaveBeenCalledWith(
    "/api/place-image?url=https%3A%2F%2Fimg.daum-kg.net%2Fphoto.png%3Fversion%3D2",
    expect.objectContaining({ retry: 0 })
  );
  expect(document.querySelectorAll(".StampCourseBoardFrame")).toHaveLength(1);
});

test("프록시 실패 시 빈 사진으로 성공 처리하지 않고 화면과 재시도 가능 상태를 유지한다", async () => {
  stampCourseStore.getState().addPlace({
    id: "photo",
    name: "Photo",
    themeId: "theme",
    imageUrl: "https://img.daum-kg.net/photo.png",
    position: { lat: 37.5, lng: 127 },
  });
  vi.spyOn(kyClient, "get").mockRejectedValue(new Error("proxy failed"));
  render(<StampCoursePanel onClose={vi.fn()} />);
  await clickDownloadImage();
  expect(await screen.findByText("이미지를 저장하지 못했어요")).toBeInTheDocument();
  expect(toBlobMock).not.toHaveBeenCalled();
  expect(clickedDownloads).toHaveLength(0);
  expect(screen.getByRole("button", { name: "이미지 저장" })).toBeEnabled();
  expect(document.querySelectorAll(".StampCourseBoardFrame")).toHaveLength(1);
});
