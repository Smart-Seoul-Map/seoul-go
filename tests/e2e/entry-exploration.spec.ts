import { mockIntroEdition, approachIntroPlace, INTRO_PLACE_NAME } from "./helpers/introEdition";
import { expect, test as base, type Page } from "@playwright/test";

const DESKTOP = { width: 1366, height: 900 };
const MOBILE = { width: 390, height: 844 };
const MOBILE_SHEET_COLLAPSED_HEIGHT = MOBILE.height * 0.5;
const MOBILE_SHEET_EXPANDED_HEIGHT = MOBILE.height * 0.9;

base.use({ actionTimeout: 10_000, launchOptions: { args: ["--disable-dev-shm-usage"] } });

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const events: object[] = [];
    const failures: string[] = [];
    page.on("pageerror", (error) => {
      failures.push(error.message);
      events.push({ event: "pageerror", message: error.message });
    });
    page.on("response", (response) => {
      const pathname = new URL(response.url()).pathname;
      if (!/^\/(assets|models)\//.test(pathname)) return;
      events.push({ event: "asset-response", pathname, status: response.status() });
      if (!response.ok()) failures.push(`${response.status()} ${pathname}`);
    });
    page.on("requestfailed", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (/^\/(assets|models)\//.test(pathname)) {
        failures.push(`${request.failure()?.errorText} ${pathname}`);
      }
      events.push({
        event: "requestfailed",
        pathname,
        error: request.failure()?.errorText,
      });
    });
    await mockIntroEdition(page);
    try {
      await use(page);
    } finally {
      await testInfo.attach("browser-events.jsonl", {
        body: events.map((event) => JSON.stringify(event)).join("\n"),
        contentType: "application/x-ndjson",
      });
    }
    expect(failures, "Uncaught errors and failed local assets").toEqual([]);
  },
});

function scene(page: Page) {
  return page.getByLabel("서울 탐방 공간", { exact: true });
}

function panel(page: Page, name = INTRO_PLACE_NAME) {
  return page.getByRole("dialog", { name, exact: true });
}

function openPlacePanel(page: Page) {
  return page.locator('.PlaceDetailPanel[data-state="open"]');
}

async function sceneryScreenshot(page: Page) {
  // Exclude the idle character and the desktop panel when observing camera movement.
  return page.screenshot({ clip: { x: 0, y: 0, width: 300, height: 240 }, timeout: 5_000 });
}

async function waitForCameraToSettle(page: Page): Promise<void> {
  let previous = await sceneryScreenshot(page);
  let stableFrames = 0;
  await expect
    .poll(
      async () => {
        const current = await sceneryScreenshot(page);
        stableFrames = current.equals(previous) ? stableFrames + 1 : 0;
        previous = current;
        return stableFrames;
      },
      { timeout: 15_000, intervals: [250] }
    )
    .toBeGreaterThanOrEqual(3);
}

async function startExploration(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("img", { name: "서울탐방 GO", exact: true })).toBeVisible();
  await expect
    .poll(
      () =>
        page
          .getByRole("img", { name: "서울탐방 GO", exact: true })
          .evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      { timeout: 45_000 }
    )
    .toBe(true);
  const start = page.getByRole("button", { name: "탐방 시작", exact: true });
  await expect(start).toBeEnabled({ timeout: 45_000 });
  await start.click();
  await expect(start).toHaveCount(0);
  await expect(scene(page)).toBeVisible({ timeout: 20_000 });
  // The canvas is visible while the intro movement still blocks input.
  await expect(scene(page)).not.toHaveAttribute("aria-busy", "true", { timeout: 45_000 });
  await expect(scene(page)).toBeEnabled();
  await expect(openPlacePanel(page)).toHaveCount(0);
}

async function arriveAtPlace(page: Page): Promise<void> {
  await approachIntroPlace(page);
  await expect(panel(page)).toBeVisible({ timeout: 15_000 });
  await expect(panel(page)).toHaveAttribute("data-state", "open");
}

async function expectPanelToStayClosed(page: Page): Promise<void> {
  await expect(openPlacePanel(page)).toHaveCount(0);
  // This is a bounded negative assertion, not a delay used to guess when loading finishes.
  const reopened = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        let opened = false;
        const observer = new MutationObserver(() => {
          opened ||= document.querySelector('.PlaceDetailPanel[data-state="open"]') !== null;
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(opened);
        }, 1_000);
      })
  );
  expect(reopened, "The dismissed panel reopened without leaving its arrival range").toBe(false);
}

async function swipe(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...from, id: 1 }],
    });
    for (let step = 1; step <= 18; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * step) / 18,
            y: from.y + ((to.y - from.y) * step) / 18,
            id: 1,
          },
        ],
      });
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      );
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await session.detach();
  }
}

test("desktop: arrival, panel input isolation, dismiss, leave and re-enter", async ({
  page,
}, testInfo) => {
  // Allow for intro loading and repeated WebGL screenshots across all four steps.
  test.setTimeout(180_000);
  await page.setViewportSize(DESKTOP);
  await test.step("Start and arrive through the visible scene", async () => {
    await startExploration(page);
    await arriveAtPlace(page);
    await expect(panel(page)).toHaveAttribute("data-appearance", "floating");
    await expect(panel(page).getByText("2025 · 서울에디션", { exact: true })).toBeVisible();
    await expect(panel(page).getByText("서울특별시 용산구 신흥로 95-9")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("desktop-arrival.png") });
  });
  await test.step("Card clicks and wheel input must not move the scene", async () => {
    const before = await sceneryScreenshot(page);
    await panel(page)
      .getByText("오래된 시장에 새로움을 입힌 개성 가득한 복합문화 공간", { exact: true })
      .click();
    await page.mouse.wheel(0, 450);
    await waitForCameraToSettle(page);
    expect((await sceneryScreenshot(page)).equals(before)).toBe(true);
    await expect(panel(page)).toHaveAttribute("data-state", "open");
  });
  await test.step("Close stays closed; leaving and returning reopens", async () => {
    await panel(page).getByRole("button", { name: "장소 정보 닫기", exact: true }).click();
    await expectPanelToStayClosed(page);
    // The first explicit dismissal now presents its one-time number reward.
    const slotClose = page.getByRole("button", { name: "슬롯 닫기" });
    await expect(slotClose).toBeEnabled({ timeout: 15000 });
    await slotClose.click();
    await expect(page.getByRole("region", { name: "숫자 슬롯" })).toHaveCount(0);
    await scene(page).click({ position: { x: 450, y: 450 } });
    await waitForCameraToSettle(page);
    await expectPanelToStayClosed(page);
    await approachIntroPlace(page);
    await expect(panel(page)).toBeVisible({ timeout: 15_000 });
  });
  await test.step("Moving away closes the open card", async () => {
    await scene(page).click({ position: { x: 450, y: 450 } });
    await expectPanelToStayClosed(page);
  });
});

test.describe("mobile", () => {
  test.use({ viewport: MOBILE, isMobile: true, hasTouch: true });

  test("arrival and sheet snap point cycling", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await startExploration(page);
    await arriveAtPlace(page);
    await expect(panel(page)).toHaveAttribute("data-presentation", "bottom-sheet");
    await expect(panel(page).getByText("2025 · 서울에디션", { exact: true })).toHaveCount(0);
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height)
      .toBeCloseTo(MOBILE_SHEET_COLLAPSED_HEIGHT, 0);
    await page.screenshot({ path: testInfo.outputPath("mobile-initial.png") });
    const handle = panel(page).getByRole("button", { name: "패널 높이 조절", exact: true });

    await handle.tap();
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height)
      .toBeCloseTo(MOBILE_SHEET_EXPANDED_HEIGHT, 0);
    await page.screenshot({ path: testInfo.outputPath("mobile-expanded.png") });
    await handle.tap();
    await expect(panel(page)).toHaveAttribute("data-state", "open");
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height)
      .toBeCloseTo(MOBILE_SHEET_COLLAPSED_HEIGHT, 0);
  });

  test("content scrolling keeps the close action reachable", async ({ page }) => {
    test.setTimeout(120_000);
    await startExploration(page);
    await arriveAtPlace(page);

    const body = panel(page).locator(".PlaceDetailPanelBody");
    await expect(body).toBeVisible();
    const scrollable = await body.evaluate(
      (element) => element.scrollHeight > element.clientHeight
    );
    if (scrollable) {
      await body.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    }
    await expect(
      panel(page).getByRole("button", { name: "장소 정보 닫기", exact: true })
    ).toBeInViewport();
  });

  test("dragging and responsive switching keep the sheet behavior stable", async ({ page }) => {
    test.setTimeout(120_000);
    await startExploration(page);
    await arriveAtPlace(page);

    const before = await sceneryScreenshot(page);
    const handle = panel(page).getByRole("button", { name: "패널 높이 조절", exact: true });
    await handle.tap();
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height)
      .toBeCloseTo(MOBILE_SHEET_EXPANDED_HEIGHT, 0);
    const box = await handle.boundingBox();
    if (!box) throw new Error("Sheet handle has no visible bounds");
    await swipe(
      page,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 + 260 }
    );
    await expect
      .poll(async () => (await panel(page).boundingBox())?.height)
      .toBeCloseTo(MOBILE_SHEET_COLLAPSED_HEIGHT, 0);
    await waitForCameraToSettle(page);
    expect((await sceneryScreenshot(page)).equals(before)).toBe(true);

    await page.setViewportSize(DESKTOP);
    await expect(panel(page)).toHaveAttribute("data-appearance", "floating");
    await expect(panel(page).getByText("2025 · 서울에디션", { exact: true })).toBeVisible();
    await page.setViewportSize(MOBILE);
    await expect(panel(page)).toHaveAttribute("data-presentation", "bottom-sheet");
    await expect(
      panel(page).getByRole("button", { name: "장소 정보 닫기", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expectPanelToStayClosed(page);
  });
});
