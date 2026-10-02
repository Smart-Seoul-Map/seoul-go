import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";

const PHOTO_BASE = "https://img.daum-kg.net/test/photo.png";

async function prepareCourse(page: Page): Promise<string[]> {
  const proxyRequests: string[] = [];
  await page.addInitScript((base) => {
    localStorage.setItem(
      "seoul-go:stamp-course:v1",
      JSON.stringify({
        version: 1,
        places: ["red", "blue"].map((color, index) => ({
          id: `photo-${index}`,
          name: color,
          themeId: "1786321258890",
          imageUrl:
            index === 0
              ? `${base}?color=${color}`
              : `/api/place-image?url=${encodeURIComponent(`${base}?color=${color}`)}`,
          position: { lat: 37.574608497, lng: 126.955611793 },
          addedAt: "2026-09-30",
        })),
      })
    );
  }, PHOTO_BASE);
  await page.route("**/openapi/v5/**", (route) =>
    route.fulfill({
      json: { header: { resultCode: "200" }, body: [] },
      headers: { "Access-Control-Allow-Origin": "*" },
    })
  );
  await page.route("**/api/smart-seoul-map/**", (route) => route.abort());
  await page.goto("/exploration/districts/10", { waitUntil: "domcontentloaded" });
  const photos = await page.evaluate(() =>
    Object.fromEntries(
      ["red", "blue", "lime"].map((color) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);
        return [color, canvas.toDataURL().split(",")[1]];
      })
    )
  );
  await page.route(`${PHOTO_BASE}*`, (route) => {
    const color = new URL(route.request().url()).searchParams.get("color")!;
    // No CORS header: display must work without anonymous crossorigin.
    return route.fulfill({ body: Buffer.from(photos[color], "base64"), contentType: "image/png" });
  });
  await page.route("**/api/place-image?**", (route) => {
    const original = new URL(route.request().url()).searchParams.get("url")!;
    proxyRequests.push(original);
    const color = new URL(original).searchParams.get("color")!;
    return route.fulfill({ body: Buffer.from(photos[color], "base64"), contentType: "image/png" });
  });
  await page.getByRole("button", { name: "코스 보기", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "담긴 코스" })).toBeVisible();
  await page
    .locator('[data-filled="true"] img')
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
    );

  return proxyRequests;
}

async function exportPixels(page: Page) {
  await page.mouse.move(0, 0);
  await expect(page.locator(".AppToast")).toHaveCount(0);
  const positions = await page.locator(".StampCourseBoardFrame").evaluate((board) => {
    const root = board.getBoundingClientRect();
    return {
      width: board.clientWidth * 2,
      height: board.clientHeight * 2,
      points: Array.from(board.querySelectorAll('[data-filled="true"] img')).map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          x: (rect.x - root.x + rect.width / 2) * 2,
          y: (rect.y - root.y + rect.height / 3) * 2,
        };
      }),
    };
  });
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "이미지 저장", exact: true }).click();
  const download = await downloading;
  const filePath = await download.path();
  const png = (await readFile(filePath!)).toString("base64");

  return page.evaluate(
    async ({ png, positions }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      return {
        actualSize: [image.width, image.height],
        expectedSize: [positions.width, positions.height],
        colors: positions.points.map(({ x, y }) =>
          Array.from(context.getImageData(x, y, 1, 1).data)
        ),
      };
    },
    { png, positions }
  );
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`exports distinct photos and preserves current dimensions at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const proxyRequests = await prepareCourse(page);
    expect(proxyRequests).toEqual([]);
    const first = await exportPixels(page);
    expect(first.actualSize).toEqual(first.expectedSize);
    expect(first.colors).toEqual([
      [255, 0, 0, 255],
      [0, 0, 255, 255],
    ]);
    expect(proxyRequests).toContain(`${PHOTO_BASE}?color=red`);
    expect(proxyRequests).toContain(`${PHOTO_BASE}?color=blue`);

    await page
      .locator('[data-filled="true"] img')
      .first()
      .evaluate(async (element, url) => {
        const image = element as HTMLImageElement;
        image.src = url;
        await image.decode();
      }, `${PHOTO_BASE}?color=lime`);
    const second = await exportPixels(page);
    expect(second.colors).toEqual([
      [0, 255, 0, 255],
      [0, 0, 255, 255],
    ]);
    expect(second.actualSize).toEqual(first.actualSize);
    await expect(page.locator(".StampCourseBoardFrame")).toHaveCount(1);
  });
}

test("a failed proxy keeps the visible photo and re-enables export", async ({ page }) => {
  await prepareCourse(page);
  await page.route("**/api/place-image?**", (route) =>
    route.fulfill({ status: 502, body: "Failed" })
  );
  await page.getByRole("button", { name: "이미지 저장", exact: true }).click();
  await expect(page.getByText("이미지를 저장하지 못했어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "이미지 저장", exact: true })).toBeEnabled();
  await expect(page.locator('[data-filled="true"] img').first()).toHaveAttribute(
    "src",
    `${PHOTO_BASE}?color=red`
  );
  await expect(page.locator(".StampCourseBoardFrame")).toHaveCount(1);
});

test("a corrupt photo cannot produce a successful export", async ({ page }) => {
  await prepareCourse(page);
  let downloads = 0;
  page.on("download", () => downloads++);
  await page.route("**/api/place-image?**", (route) =>
    route.fulfill({
      body: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
      contentType: "image/png",
    })
  );
  await page.getByRole("button", { name: "이미지 저장", exact: true }).click();
  await expect(page.getByText("이미지를 저장하지 못했어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "이미지 저장", exact: true })).toBeEnabled();
  await expect(page.locator('[data-filled="true"] img').first()).toHaveAttribute(
    "src",
    `${PHOTO_BASE}?color=red`
  );
  await expect(page.locator(".StampCourseBoardFrame")).toHaveCount(1);
  expect(downloads).toBe(0);
});
