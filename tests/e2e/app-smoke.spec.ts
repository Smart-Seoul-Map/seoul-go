import { expect, test, type Page, type Response } from "@playwright/test";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROUTES_TO_CHECK = ["/", "/exploration", "/exploration/districts/8"] as const;
const CHARACTER_GLB_PATHS = [
  "/models/chunsik_v1.glb",
  "/models/chunsik_idle_01_v1.glb",
  "/models/chunsik_run_v1.glb",
] as const;
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);
const glbResponseCache = new Map<string, Buffer>();

function isBuiltAssetResponse(response: Response): boolean {
  const url = new URL(response.url());

  return url.pathname.startsWith("/assets/") && /\.(css|js)$/.test(url.pathname);
}

async function expectRouteCanvasToRender(page: Page, route: string): Promise<void> {
  const invalidAssetResponses: string[] = [];

  await mockSmartSeoulTiles(page);

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

async function mockSmartSeoulTiles(page: Page): Promise<void> {
  await page.route("**/api/smart-seoul-map/tms/**", async (route) => {
    await route.fulfill({
      body: TRANSPARENT_PNG,
      contentType: "image/png",
      status: 200,
    });
  });
}

async function countCharacterGltfRequests(page: Page): Promise<Map<string, number>> {
  const glbRequestCounts = new Map<string, number>();

  await page.route("**/models/*.glb", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (CHARACTER_GLB_PATHS.includes(pathname as (typeof CHARACTER_GLB_PATHS)[number])) {
      glbRequestCounts.set(pathname, (glbRequestCounts.get(pathname) ?? 0) + 1);
    }

    await route.fulfill({
      body: await readPublicFile(pathname),
      contentType: "model/gltf-binary",
      status: 200,
    });
  });

  return glbRequestCounts;
}

async function navigateInSameAppSession(page: Page, route: string): Promise<void> {
  await page.evaluate((nextRoute) => {
    window.history.pushState(null, "", nextRoute);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, route);
}

async function readPublicFile(publicPathname: string): Promise<Buffer> {
  const cachedFile = glbResponseCache.get(publicPathname);

  if (cachedFile) {
    return cachedFile;
  }

  const file = await readFile(path.join(process.cwd(), "public", publicPathname.slice(1)));

  glbResponseCache.set(publicPathname, file);

  return file;
}

test("renders the main app routes in a real browser", async ({ page }) => {
  for (const route of ROUTES_TO_CHECK) {
    await expectRouteCanvasToRender(page, route);
  }

  await page.goto("about:blank");
});

test("reuses character GLBs when route changes in one app session", async ({ page }) => {
  await mockSmartSeoulTiles(page);
  const glbRequestCounts = await countCharacterGltfRequests(page);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => glbRequestCounts.get("/models/chunsik_v1.glb") ?? 0).toBe(1);
  await expect.poll(() => glbRequestCounts.get("/models/chunsik_idle_01_v1.glb") ?? 0).toBe(1);

  await navigateInSameAppSession(page, "/exploration");
  await expect(page).toHaveURL(/\/exploration$/);
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1_000);

  expect(glbRequestCounts.get("/models/chunsik_v1.glb")).toBe(1);
  expect(glbRequestCounts.get("/models/chunsik_idle_01_v1.glb")).toBe(1);
  expect(glbRequestCounts.get("/models/chunsik_run_v1.glb") ?? 0).toBeLessThanOrEqual(1);
});
