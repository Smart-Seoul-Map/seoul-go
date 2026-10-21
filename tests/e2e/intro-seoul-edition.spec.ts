import { expect, test, type Page } from "@playwright/test";

import { startIntro } from "./helpers/introEdition";

const THEME = "1786321258890";
const MODELED_PLACE_IDS = [
  "25_edition25_24",
  "25_edition25_12",
  "25_edition25_20",
  "25_edition25_2",
  "25_edition25_6",
]
  .map((contentId) => `smart-seoul:${THEME}:${contentId}`)
  .sort();
const MODEL_PATHS = [
  "/models/places/achasan_eoullim_garden.glb",
  "/models/places/amsa_dong_site.glb",
  "/models/places/gangbyeon_seojae.glb",
  "/models/places/namsan_baekbeom_square.glb",
  "/models/places/yongyangbongjeojeong_park.glb",
];

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

async function readLandmarkAnchors(page: Page): Promise<Record<string, [number, number]>> {
  return page.locator(".EntryEditionLandmark").evaluateAll((buttons) =>
    Object.fromEntries(
      buttons.map((button) => {
        const bounds = button.getBoundingClientRect();
        return [
          button.getAttribute("data-place-id") ?? "",
          [Math.round(bounds.x + bounds.width / 2), Math.round(bounds.bottom)],
        ];
      })
    )
  );
}

async function startExploration(page: Page) {
  await startIntro(page);
  await expect(page.getByLabel("서울 탐방 공간", { exact: true })).not.toHaveAttribute(
    "aria-busy",
    "true",
    { timeout: 45000 }
  );
}

test("shows only places with a GLB model in the same slots on every visit, falls back to images when models fail, and shares the query with district exploration", async ({
  page,
}) => {
  test.setTimeout(120000);
  const calls: string[] = [];
  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", async (route) => {
    calls.push(route.request().url());
    await route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: {
        header: {
          resultCode: "200",
          PAGE_NO: 1,
          PAGE_SIZE: 100,
          PAGE_COUNT: 1,
          TOTAL_COUNT: 50,
          DATA_COUNT: 50,
        },
        body: Array.from({ length: 50 }, (_, index) => ({
          COT_THEME_ID: THEME,
          COT_CONTS_ID: `${index < 25 ? 25 : 26}_edition25_${(index % 25) + 1}`,
          COT_CONTS_NAME: `서울에디션 장소 ${index + 1}`,
          COT_VALUE_01: `장소 ${index + 1} 소개`,
          COT_COORD_X: 126.985,
          COT_COORD_Y: 37.545,
          COT_GU_NAME: "용산구",
        })),
      },
    });
  });
  await page.route("**/api/smart-seoul-map/tms/**", (route) => route.abort());
  const modelRequests = new Set<string>();
  await page.route("**/models/places/*.glb", (route) => {
    modelRequests.add(new URL(route.request().url()).pathname);
    return route.abort();
  });
  await page.goto("/");
  await startExploration(page);
  await expect(page.locator(".EntryEditionLandmark")).toHaveCount(MODELED_PLACE_IDS.length);
  const first = await page
    .locator(".EntryEditionLandmark")
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-place-id")));
  expect([...first].sort()).toEqual(MODELED_PLACE_IDS);
  await expect
    .poll(async () => new Set(Object.values(await readLandmarkAnchors(page)).map(String)).size)
    .toBe(MODELED_PLACE_IDS.length);
  const firstAnchors = await readLandmarkAnchors(page);
  expect([...modelRequests].sort()).toEqual(MODEL_PATHS);
  expect(calls).toHaveLength(1);
  await page.evaluate(() => {
    history.pushState(null, "", "/exploration/districts/8");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator(".entry-exploration-page")).toHaveCount(0);
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.evaluate(() => {
    history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await startExploration(page);
  await expect(page.locator(".EntryEditionLandmark")).toHaveCount(MODELED_PLACE_IDS.length);
  const second = await page
    .locator(".EntryEditionLandmark")
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-place-id")));
  expect([...second].sort()).toEqual(MODELED_PLACE_IDS);
  await expect.poll(() => readLandmarkAnchors(page)).toEqual(firstAnchors);
  expect(calls).toHaveLength(1);
});

test("keeps entry closed while loading and retries after an API error", async ({ page }) => {
  test.setTimeout(120000);
  let succeed = false;
  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", (route) =>
    route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: succeed
        ? {
            header: {
              resultCode: "200",
              PAGE_NO: 1,
              PAGE_SIZE: 100,
              PAGE_COUNT: 1,
              TOTAL_COUNT: 1,
              DATA_COUNT: 1,
            },
            body: [
              {
                COT_THEME_ID: THEME,
                COT_CONTS_ID: "25_edition25_24",
                COT_CONTS_NAME: "해방촌신흥시장",
                COT_COORD_X: 126.985,
                COT_COORD_Y: 37.545,
              },
            ],
          }
        : { header: { resultCode: "400", resultMessage: "test failure" } },
    })
  );
  await page.route("**/models/places/*.glb", (route) => route.abort());
  await page.goto("/");
  const start = page.getByRole("button", { name: "서울 탐방 시작하기", exact: true });
  await expect(start).toBeEnabled({ timeout: 45000 });
  expect(await page.locator(".EntryEditionLandmark").count()).toBe(0);
  succeed = true;
  await expect(async () => {
    await start.focus({ timeout: 1000 });
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("서울 탐방 공간", { exact: true })).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 45000 });
  await expect(page.getByLabel("서울 탐방 공간", { exact: true })).not.toHaveAttribute(
    "aria-busy",
    "true",
    { timeout: 45000 }
  );
  await expect(page.locator(".EntryEditionLandmark")).toHaveCount(1);
});
