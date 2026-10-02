import { expect, test } from "@playwright/test";

const THEME = "1786321258890";
const SELECTION_KEY = "seoul-go:entry-edition-selection:v1";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

test("selects ten nonrepeating places per entry and shares the query with district exploration", async ({
  page,
}) => {
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
  // Use image fallbacks so random GLB selections do not change the DOM count.
  await page.route("**/models/places/*.glb", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".EntryEditionLandmark")).toHaveCount(10);
  const first = await page
    .locator(".EntryEditionLandmark")
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-place-id")));
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
  await expect(page.locator(".EntryEditionLandmark")).toHaveCount(10);
  const second = await page
    .locator(".EntryEditionLandmark")
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("data-place-id")));
  expect(second.every((id) => !first.includes(id))).toBe(true);
  expect(calls).toHaveLength(1);
  const stored: string[] = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
    SELECTION_KEY
  );
  expect([...stored].sort()).toEqual([...second].sort());
});

test("keeps entry closed while loading and retries after an API error", async ({ page }) => {
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
                COT_CONTS_ID: "25_edition25_21",
                COT_CONTS_NAME: "해방촌신흥시장",
                COT_COORD_X: 126.985,
                COT_COORD_Y: 37.545,
              },
            ],
          }
        : { header: { resultCode: "400", resultMessage: "test failure" } },
    })
  );
  await page.goto("/");
  const retry = page.getByRole("button", { name: "장소 다시 불러오기" });
  await expect(retry).toBeEnabled();
  expect(await page.locator(".EntryEditionLandmark").count()).toBe(0);
  succeed = true;
  await retry.click();
  await expect(page.getByRole("button", { name: "탐방 시작", exact: true })).toBeEnabled({
    timeout: 45000,
  });
  await expect(page.locator(".EntryEditionLandmark")).toHaveCount(1);
});
