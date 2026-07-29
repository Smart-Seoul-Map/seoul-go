import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";

const DISTRICT_ROUTES_TO_CHECK = [
  "/exploration/districts/8",
  "/",
  "/exploration/districts/1",
  "/exploration/districts/2",
] as const;
const YONGSAN_DISTRICT_NAME = "\uC6A9\uC0B0\uAD6C";
const GANGNAM_DISTRICT_NAME = "\uAC15\uB0A8\uAD6C";
const SMART_SEOUL_THEME_IDS = [
  "100032",
  "1741228380725",
  "1777251935025",
  "1725252918740",
  "100575",
] as const;
const SMART_SEOUL_THEME_PAGE_COUNTS = {
  "100032": 5,
  "100575": 2,
  "1725252918740": 1,
  "1741228380725": 1,
  "1777251935025": 1,
} as const satisfies Record<(typeof SMART_SEOUL_THEME_IDS)[number], number>;
const EXPECTED_SOURCE_REQUEST_COUNT = Object.values(SMART_SEOUL_THEME_PAGE_COUNTS).reduce(
  (sum, pageCount) => sum + pageCount,
  0
);
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

async function mockSmartSeoulTiles(page: Page): Promise<void> {
  await page.route("**/api/smart-seoul-map/tms/**", async (route) => {
    await route.fulfill({
      body: TRANSPARENT_PNG,
      contentType: "image/png",
      status: 200,
    });
  });
}

async function collectSmartSeoulThemeContentRequests(page: Page): Promise<string[]> {
  const requestUrls: string[] = [];

  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", async (route) => {
    const url = new URL(route.request().url());
    const themeId = url.searchParams.get("theme_id") ?? SMART_SEOUL_THEME_IDS[0];
    const pageNo = Number(url.searchParams.get("page_no") ?? "1");
    const pageCount =
      SMART_SEOUL_THEME_PAGE_COUNTS[themeId as (typeof SMART_SEOUL_THEME_IDS)[number]] ?? 1;

    requestUrls.push(url.toString());

    await route.fulfill({
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
      },
      json: {
        header: {
          PAGE_COUNT: pageCount,
          resultCode: "200",
        },
        body: [
          createSmartSeoulThemePlaceRow({
            contentId: `${themeId}-${pageNo}-yongsan`,
            districtName: YONGSAN_DISTRICT_NAME,
            name: `Yongsan ${themeId}`,
            themeId,
          }),
          createSmartSeoulThemePlaceRow({
            contentId: `${themeId}-${pageNo}-gangnam`,
            districtName: GANGNAM_DISTRICT_NAME,
            name: `Gangnam ${themeId}`,
            themeId,
          }),
        ],
      },
      status: 200,
    });
  });

  return requestUrls;
}

async function navigateInSameAppSession(page: Page, route: string): Promise<void> {
  await page.evaluate((nextRoute) => {
    window.history.pushState(null, "", nextRoute);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, route);
}

function createSmartSeoulThemePlaceRow({
  contentId,
  districtName,
  name,
  themeId,
}: {
  contentId: string;
  districtName: string;
  name: string;
  themeId: string;
}) {
  return {
    COT_CONTS_ID: contentId,
    COT_CONTS_NAME: name,
    COT_COORD_X: "126.990703",
    COT_COORD_Y: "37.532326",
    COT_GU_NAME: districtName,
    COT_THEME_ID: themeId,
    THM_THEME_NAME: "Theme",
  };
}

test("reuses the Smart Seoul theme places source query across district selection flow", async ({
  page,
}) => {
  await mockSmartSeoulTiles(page);
  const requestUrls = await collectSmartSeoulThemeContentRequests(page);

  await page.goto(DISTRICT_ROUTES_TO_CHECK[0], { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => requestUrls.length).toBe(EXPECTED_SOURCE_REQUEST_COUNT);

  for (const route of DISTRICT_ROUTES_TO_CHECK.slice(1)) {
    await navigateInSameAppSession(page, route);
    await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}$`));
    await page.waitForTimeout(500);
  }

  expect(requestUrls).toHaveLength(EXPECTED_SOURCE_REQUEST_COUNT);
  expect(
    requestUrls.every(
      (url) => !url.includes(YONGSAN_DISTRICT_NAME) && !url.includes(GANGNAM_DISTRICT_NAME)
    )
  ).toBe(true);
});
