import { expect, test, type Page } from "@playwright/test";

import { mockIntroEdition, startIntro } from "./helpers/introEdition";

const DESKTOP = { width: 1366, height: 900 };
const MAX_WALK_STEPS = 12;
// Canvas area kept clear of the number panel (bottom left) and toasts (bottom) when clicking.
const CLICK_AREA = { left: 0.05, right: 0.95, top: 0.05, bottom: 0.85 };
// The camera shows cameraViewSize (19) world units across the canvas height, so one screen pixel
// covers at least 19 / height units on the ground.
const CAMERA_VIEW_SIZE = 19;
// Floor steps stop this far from the asset on the screen: past half of the widest asset image
// (waterfront and store, 8 units) and beyond the 4-unit arrival radius.
const FLOOR_STEP_CLEARANCE = 7;

type AssetPlace = {
  placeId: "hanok" | "waterfront" | "store";
  title: string;
  linkLabel: string;
  href: string;
};

// The intro shows hanok, store and waterfront landmarks. Their panels share one visit flow, so this
// walks to hanok only; unit tests cover each asset's panel text, link and click routing.
const ASSET_LANDMARK_COUNT = 3;
const HANOK: AssetPlace = {
  placeId: "hanok",
  title: "한옥체험",
  linkLabel: "한옥체험 지도 보기",
  href: "https://map.seoul.go.kr/smgis2/short/6P5oo",
};

test.use({ actionTimeout: 10_000, launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

test.beforeEach(async ({ page }) => mockIntroEdition(page));

function scene(page: Page) {
  return page.getByLabel("서울 탐방 공간", { exact: true });
}

function assetPanel(page: Page, title: string) {
  return page.getByRole("dialog", { name: title, exact: true });
}

function openPlacePanel(page: Page) {
  return page.locator('.PlaceDetailPanel[data-state="open"]');
}

function assetMarker(page: Page, placeId: AssetPlace["placeId"]) {
  return page.locator(`.EntryAssetLandmark[data-place-id="${placeId}"]`);
}

async function readAssetMarker(page: Page, placeId: AssetPlace["placeId"]) {
  return assetMarker(page, placeId).evaluate((marker) => {
    // A hidden marker (outside the camera depth range or before the scene is ready) has no position.
    if (marker.getClientRects().length === 0) throw new Error("The asset marker is not rendered");
    const bounds = marker.getBoundingClientRect();
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  });
}

async function readCollectedNumberCount(page: Page): Promise<string> {
  const label = await page
    .getByRole("button", { name: /^내 번호 (열기|접기), \d+개 획득$/ })
    .getAttribute("aria-label");
  return label?.match(/\d+개 획득/)?.[0] ?? "";
}

// Returns the asset's marker when it is clickable, otherwise a floor point toward it that stops
// short of its image and arrival radius.
async function nextClickToward(page: Page, placeId: AssetPlace["placeId"]) {
  const box = await scene(page).boundingBox();
  if (!box) throw new Error("The entry scene has no visible bounds");
  const marker = await readAssetMarker(page, placeId);
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const limit = {
    left: center.x - (box.x + box.width * CLICK_AREA.left),
    right: box.x + box.width * CLICK_AREA.right - center.x,
    up: center.y - (box.y + box.height * CLICK_AREA.top),
    down: box.y + box.height * CLICK_AREA.bottom - center.y,
  };
  const offset = { x: marker.x - center.x, y: marker.y - center.y };
  const scale = Math.min(
    1,
    offset.x > 0 ? limit.right / offset.x : offset.x < 0 ? limit.left / -offset.x : 1,
    offset.y > 0 ? limit.down / offset.y : offset.y < 0 ? limit.up / -offset.y : 1
  );
  if (scale === 1) return { point: marker, onAsset: true };

  // A click anywhere on the asset image walks to the asset, and passing within the arrival radius
  // opens its panel, so the step stops outside both along the screen axis it mostly travels on.
  const clearance = (FLOOR_STEP_CLEARANCE * box.height) / CAMERA_VIEW_SIZE;
  const reach = Math.min(scale, 1 - clearance / Math.max(Math.abs(offset.x), Math.abs(offset.y)));

  return {
    point: { x: center.x + offset.x * reach, y: center.y + offset.y * reach },
    onAsset: false,
  };
}

async function waitForWalkToEnd(page: Page, placeId: AssetPlace["placeId"]): Promise<void> {
  // The camera follows the character, so the marker stops moving once the walk ends.
  let previous = JSON.stringify(await readAssetMarker(page, placeId));
  let stableReads = 0;
  await expect
    .poll(
      async () => {
        const current = JSON.stringify(await readAssetMarker(page, placeId));
        stableReads = current === previous ? stableReads + 1 : 0;
        previous = current;
        return stableReads;
      },
      { timeout: 15_000, intervals: [200] }
    )
    .toBeGreaterThanOrEqual(3);
}

async function closeOtherPlacePanel(page: Page): Promise<void> {
  const panel = openPlacePanel(page);
  if ((await panel.count()) === 0) return;
  const toast = page.locator(".AppToast");
  await panel.getByRole("button", { name: "장소 정보 닫기", exact: true }).click();
  await expect(panel).toHaveCount(0);
  // An edition place on the way shows its reward toast after closing; let it go before checking the asset.
  // Places without a reward show none, so a missing toast within the bound is expected.
  await toast
    .first()
    .waitFor({ state: "attached", timeout: 1_000 })
    .catch(() => undefined);
  await expect(toast).toHaveCount(0, { timeout: 10_000 });
}

// Walks by clicking the scene and reports whether the last step was a click on the asset itself.
async function walkToAsset(page: Page, asset: AssetPlace): Promise<"asset" | "floor"> {
  const panel = assetPanel(page, asset.title);
  let lastClick: "asset" | "floor" = "floor";
  for (let step = 0; step < MAX_WALK_STEPS; step += 1) {
    if (await panel.isVisible()) return lastClick;
    await closeOtherPlacePanel(page);
    const { point, onAsset } = await nextClickToward(page, asset.placeId);
    lastClick = onAsset ? "asset" : "floor";
    await page.mouse.click(point.x, point.y);
    if (onAsset) {
      // The walk ends at this asset or at another place passed on the way.
      await expect(openPlacePanel(page)).toHaveCount(1, { timeout: 15_000 });
    } else {
      await waitForWalkToEnd(page, asset.placeId);
    }
  }
  await expect(panel).toBeVisible();
  return lastClick;
}

async function expectNothingToAppear(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(0);
  // This is a bounded negative assertion, not a delay used to guess when loading finishes.
  const appeared = await page.evaluate(
    (watchedSelector) =>
      new Promise<boolean>((resolve) => {
        let found = document.querySelector(watchedSelector) !== null;
        const observer = new MutationObserver(() => {
          found ||= document.querySelector(watchedSelector) !== null;
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(found);
        }, 1_000);
      }),
    selector
  );
  expect(appeared, `Unexpected ${selector} after closing the asset panel`).toBe(false);
}

test("desktop: clicking hanok walks there and opens its map link panel without rewards", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize(DESKTOP);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await startIntro(page);
  await expect(scene(page)).toBeVisible({ timeout: 20_000 });
  await expect(scene(page)).not.toHaveAttribute("aria-busy", "true", { timeout: 45_000 });
  await expect(page.locator(".EntryEditionLabels")).toBeVisible();
  await expect(page.locator(".EntryAssetLandmark")).toHaveCount(ASSET_LANDMARK_COUNT);

  const panel = assetPanel(page, HANOK.title);
  const arrivedBy = await walkToAsset(page, HANOK);
  expect(arrivedBy, `${HANOK.title} should be reached by clicking the asset`).toBe("asset");
  await expect(panel).toHaveAttribute("data-state", "open");
  await expect(openPlacePanel(page)).toHaveCount(1);
  const link = panel.getByRole("link", {
    name: `${HANOK.linkLabel} (새 탭에서 열기)`,
    exact: true,
  });
  await expect(link).toHaveAttribute("href", HANOK.href);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /(^|\s)noopener(\s|$)/);
  await expect(page.locator(".AppToast")).toHaveCount(0);
  await expect(page.locator(".AppSpeechBubble")).toHaveCount(0);
  const collectedNumbers = await readCollectedNumberCount(page);

  await panel.getByRole("button", { name: "장소 정보 닫기", exact: true }).click();
  await expectNothingToAppear(
    page,
    '.AppToast, .AppSpeechBubble, .PlaceDetailPanel[data-state="open"]'
  );
  expect(await readCollectedNumberCount(page)).toBe(collectedNumbers);
});
