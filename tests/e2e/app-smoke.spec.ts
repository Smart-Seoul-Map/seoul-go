import { expect, test, type Page, type Response } from "@playwright/test";
import { Buffer } from "node:buffer";

const ROUTES_TO_CHECK = ["/", "/exploration", "/exploration/districts/8"] as const;
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

function isBuiltAssetResponse(response: Response): boolean {
  const url = new URL(response.url());

  return url.pathname.startsWith("/assets/") && /\.(css|js)$/.test(url.pathname);
}

async function expectRouteCanvasToRender(page: Page, route: string): Promise<void> {
  const invalidAssetResponses: string[] = [];

  await page.route("**/api/smart-seoul-map/tms/**", async (route) => {
    await route.fulfill({
      body: TRANSPARENT_PNG,
      contentType: "image/png",
      status: 200,
    });
  });

  page.on("response", (response) => {
    if (!isBuiltAssetResponse(response)) {
      return;
    }

    const contentType = response.headers()["content-type"] ?? "";

    if (contentType.includes("text/html")) {
      invalidAssetResponses.push(`${response.status()} ${response.url()} (${contentType})`);
    }
  });

  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  expect(invalidAssetResponses).toEqual([]);
}

test("renders the main app routes in a real browser", async ({ page }) => {
  for (const route of ROUTES_TO_CHECK) {
    await expectRouteCanvasToRender(page, route);
  }

  await page.goto("about:blank");
});
