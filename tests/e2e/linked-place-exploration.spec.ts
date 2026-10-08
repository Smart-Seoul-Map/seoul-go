import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";

test.use({ trace: "off" });
const edition = "1786321258890";
const pointA = { lat: 37.54532375, lng: 126.985085516 };
const pointB = { lat: 37.54532375, lng: 126.9865 };
const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

function row(id: string, name: string, themeId: string, position = pointA, distance = 0) {
  return {
    COT_CONTS_ID: id,
    COT_CONTS_NAME: name,
    COT_THEME_ID: themeId,
    COT_COORD_X: position.lng,
    COT_COORD_Y: position.lat,
    COT_GU_NAME: "용산구",
    COT_VALUE_01: "장소 소개",
    COT_IMG_MAIN_URL: "/images/seoul-characters/hachi.png",
    DIST: distance,
  };
}

async function setup(page: Page) {
  const requests: { themeId: string; center: string | null; page: number }[] = [];
  await page.addInitScript(
    ({ edition, pointA }) => {
      if (localStorage.getItem("seoul-go:stamp-course:v1")) return;
      localStorage.setItem(
        "seoul-go:stamp-course:v1",
        JSON.stringify({
          version: 1,
          places: [
            {
              id: `smart-seoul:${edition}:25_edition25_1`,
              name: "기준 장소 A",
              themeId: edition,
              position: pointA,
              addedAt: "2026-01-01T00:00:00.000Z",
            },
            {
              id: "smart-seoul:100032:A-119",
              name: "연계 A 119",
              themeId: "100032",
              position: pointA,
              addedAt: "2026-01-01T00:00:01.000Z",
            },
          ],
        })
      );
    },
    { edition, pointA }
  );
  await page.route("**/api/smart-seoul-map/tms/**", (route) =>
    route.fulfill({ body: transparentPng, contentType: "image/png" })
  );
  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const themeId = params.get("theme_id") ?? "";
    const pageNo = Number(params.get("page_no"));
    const isA = params.get("coord_x") === String(pointA.lng);
    requests.push({ themeId, center: params.get("coord_x"), page: pageNo });
    let rows = [
      row("25_edition25_1", "기준 장소 A", edition, pointA),
      row("26_edition25_1", "기준 장소 B", edition, pointB),
    ];
    if (themeId !== edition) {
      rows =
        themeId === "100032"
          ? Array.from({ length: isA ? 120 : 3 }, (_, i) =>
              row(
                `${isA ? "A" : "B"}-${i}`,
                `연계 ${isA ? "A" : "B"} ${i}`,
                "100032",
                { lat: 37.546 + (i % 4) * 0.0003, lng: 126.985 + (i % 5) * 0.0003 },
                (120 - i) / 10000
              )
            )
          : [];
    }
    const total = rows.length;
    await route.fulfill({
      json: {
        header: {
          resultCode: total ? "200" : "100",
          TOTAL_COUNT: total,
          PAGE_COUNT: Math.ceil(total / 100),
          PAGE_NO: total ? pageNo : 0,
          PAGE_SIZE: total ? 100 : 0,
        },
        body: rows.slice((pageNo - 1) * 100, pageNo * 100),
      },
    });
  });
  return requests;
}

test("failed linked queries can retry to an empty result without showing partial places", async ({
  page,
}) => {
  await setup(page);
  let fail = true;
  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("theme_id") === edition) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      json: {
        header: {
          resultCode: fail ? "400" : "100",
          TOTAL_COUNT: 0,
          PAGE_COUNT: 0,
          PAGE_NO: 0,
          PAGE_SIZE: 0,
        },
        body: [],
      },
    });
  });
  await page.goto(`/exploration?lat=${pointB.lat}&lng=${pointB.lng}`);
  await page.getByRole("button", { name: "기준 장소 B 2026년 선정 장소로 이동" }).click();
  await page
    .getByRole("dialog", { name: "기준 장소 B", exact: true })
    .getByRole("button", { name: "스탬프/코스 추가", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "근처 추천 장소", exact: true });
  await expect(panel.getByRole("alert")).toHaveText("근처 장소를 불러오지 못했어요.");
  await expect(panel.getByRole("listitem")).toHaveCount(0);
  fail = false;
  await panel.getByRole("button", { name: "다시 시도" }).click();
  await expect(panel.getByRole("status")).toHaveText("반경 1km 안에 연계 장소가 없어요.");
  await expect(panel.getByRole("listitem")).toHaveCount(0);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: additions, reference tabs, cache and existing course remain separate`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    const requests = await setup(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/exploration?lat=${pointB.lat}&lng=${pointB.lng}`);
    const markerB = page.getByRole("button", { name: "기준 장소 B 2026년 선정 장소로 이동" });
    await expect(markerB).toBeVisible({ timeout: 20000 });
    // An Edition saved before reload restores its previously unlocked nearby places.
    await expect
      .poll(() =>
        requests.some(
          (request) => request.themeId === "100032" && request.center === String(pointA.lng)
        )
      )
      .toBe(true);
    expect(
      requests.some(
        (request) => request.themeId !== edition && request.center === String(pointB.lng)
      )
    ).toBe(false);
    const originalCanvas = await page.locator("canvas").first().elementHandle();
    await markerB.click();
    const detail = page.getByRole("dialog", { name: "기준 장소 B", exact: true });
    await expect(detail).toBeVisible({ timeout: 10000 });
    await detail.getByRole("button", { name: "스탬프/코스 추가", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "근처 추천 장소", exact: true });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("listitem")).toHaveCount(3);
    const tabs = panel.getByRole("tab");
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await tabs.nth(0).click();
    await expect(panel.getByRole("listitem")).toHaveCount(120);
    await expect(panel.getByRole("listitem").first()).toContainText("연계 A 119");
    await expect(
      panel.getByRole("button", { name: /지도에서 보기|순서 변경|스탬프 보드/ })
    ).toHaveCount(0);
    await expect(panel.getByText(/직선거리|Step/)).toHaveCount(0);
    const requestCount = requests.length;
    await tabs.nth(1).click();
    await expect(panel.getByRole("listitem")).toHaveCount(3);
    await tabs.nth(0).click();
    await expect(panel.getByRole("listitem")).toHaveCount(120);
    expect(requests).toHaveLength(requestCount);
    expect(await originalCanvas!.evaluate((canvas) => canvas.isConnected)).toBe(true);
    await expect(page.locator(".ExplorationImageYearMarker")).toHaveCount(2);
    await page.screenshot({
      path: info.outputPath(`${viewport.name}-recommendations.png`),
      fullPage: true,
    });
    const overflow = await panel.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflow).toBe(false);
    const calloutBounds = await page.locator(".LinkedPlacesCallout").boundingBox();
    expect(calloutBounds).not.toBeNull();
    expect(calloutBounds!.x + calloutBounds!.width).toBeLessThan(viewport.width);
    if (viewport.name === "desktop") expect(calloutBounds!.width).toBeLessThanOrEqual(390);
    await panel.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(panel).toHaveCount(0);
    const reopen = page.getByRole("button", { name: "근처 추천", exact: true });
    await expect(reopen).toBeVisible();
    const reopenBounds = await reopen.boundingBox();
    expect(reopenBounds!.x + reopenBounds!.width).toBeLessThanOrEqual(viewport.width);
    const zoomBounds = await page.locator(".maplibregl-ctrl-top-right").boundingBox();
    expect(reopenBounds!.y).toBeGreaterThanOrEqual(zoomBounds!.y + zoomBounds!.height);
    await page.screenshot({ path: info.outputPath(`${viewport.name}-reopen.png`), fullPage: true });
    await reopen.click();
    await expect(panel.getByRole("listitem")).toHaveCount(120);
    expect(requests).toHaveLength(requestCount);
    await panel.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await page.reload();
    await expect(reopen).toBeVisible({ timeout: 20000 });
    await reopen.click();
    await expect(panel.getByRole("listitem")).toHaveCount(3);
    await panel.getByRole("tab").nth(0).click();
    await expect(panel.getByRole("listitem")).toHaveCount(120);
    const unlockedCount = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("seoul-go:unlocked-linked-places:v1") ?? "{}").references
          ?.length
    );
    expect(unlockedCount).toBe(2);
    await panel.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await page.getByRole("button", { name: "코스 보기", exact: true }).click();
    const course = page.getByRole("dialog", { name: "담긴 코스", exact: true });
    await expect(course).toBeVisible();
    await expect(course.getByRole("button", { name: "편집", exact: true })).toBeVisible();
    await expect(course.getByRole("button", { name: "카카오 도보길찾기" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

const linkedThemeIds = ["100032", "1741228380725", "1777251935025", "1725252918740", "100575"];
const emptyModelThemeId = "1741228380725";
const decodablePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==",
  "base64"
);

test("loads each linked marker GLB once across tabs and panel reopen, even an empty one", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/smart-seoul-map/tms/**", (route) =>
    route.fulfill({ body: decodablePng, contentType: "image/png" })
  );
  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const themeId = params.get("theme_id") ?? "";
    if (themeId === edition || themeId === "100032") {
      await route.fallback();
      return;
    }
    const rows =
      params.get("coord_x") === String(pointA.lng)
        ? [row(`${themeId}-1`, `연계 ${themeId}`, themeId, { lat: 37.5458, lng: 126.9858 }, 0.01)]
        : [];
    await route.fulfill({
      json: {
        header: {
          resultCode: rows.length ? "200" : "100",
          TOTAL_COUNT: rows.length,
          PAGE_COUNT: rows.length ? 1 : 0,
          PAGE_NO: rows.length ? 1 : 0,
          PAGE_SIZE: rows.length ? 100 : 0,
        },
        body: rows,
      },
    });
  });
  const modelRequests = new Map<string, number>();
  const modelResponses = new Map<string, number>();
  await page.route("**/models/markers/*.glb", async (route) => {
    const fileName = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    modelRequests.set(fileName, (modelRequests.get(fileName) ?? 0) + 1);
    await route.continue();
  });
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (!pathname.startsWith("/models/markers/")) return;
    const fileName = pathname.split("/").at(-1) ?? "";
    modelResponses.set(fileName, response.status());
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`console: ${message.text()} @ ${message.location().url}`);
  });
  const expectEachModelLoadedOnce = () =>
    expect
      .poll(() => linkedThemeIds.map((themeId) => modelRequests.get(`${themeId}.glb`) ?? 0))
      .toEqual(linkedThemeIds.map(() => 1));

  await page.goto(`/exploration?lat=${pointB.lat}&lng=${pointB.lng}`);
  const markerB = page.getByRole("button", { name: "기준 장소 B 2026년 선정 장소로 이동" });
  await expect(markerB).toBeVisible({ timeout: 20000 });
  await expectEachModelLoadedOnce();
  await expect.poll(() => modelResponses.get(`${emptyModelThemeId}.glb`)).toBe(200);

  await markerB.click();
  await page
    .getByRole("dialog", { name: "기준 장소 B", exact: true })
    .getByRole("button", { name: "스탬프/코스 추가", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "근처 추천 장소", exact: true });
  await expect(panel.getByRole("listitem")).toHaveCount(3);
  const tabs = panel.getByRole("tab");
  await tabs.nth(0).click();
  await expect(panel.getByRole("listitem")).toHaveCount(124);
  await tabs.nth(1).click();
  await expect(panel.getByRole("listitem")).toHaveCount(3);
  await panel.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "근처 추천", exact: true }).click();
  await expect(panel.getByRole("listitem")).toHaveCount(3);
  await panel.getByRole("tab").nth(0).click();
  await expect(panel.getByRole("listitem")).toHaveCount(124);

  await expectEachModelLoadedOnce();
  expect([...modelRequests.keys()].sort()).toEqual(
    linkedThemeIds.map((themeId) => `${themeId}.glb`).sort()
  );
  expect(errors).toEqual([]);
});
