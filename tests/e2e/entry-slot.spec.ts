import { expect, test } from "@playwright/test";

import { mockIntroEdition } from "./helpers/introEdition";

test.beforeEach(async ({ page }) => mockIntroEdition(page));

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader"] } });

test("keeps the entry canvas inside the viewport after rotating to landscape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const canvas = page.locator(".entry-exploration-scene canvas");
  await expect(canvas).toBeVisible();

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 640, height: 320 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const bounds = await canvas.boundingBox();
        return bounds ? bounds.y + bounds.height : Infinity;
      })
      .toBeLessThanOrEqual(viewport.height);
  }
});

test("shipped slot GLB has separate reels and embedded resources", async ({ request }) => {
  const response = await request.get("/models/slot_v1.glb");
  expect(response.ok()).toBe(true);
  const buffer = await response.body();
  const document = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
  expect(document.nodes.map((node: { name: string }) => node.name)).toEqual(
    expect.arrayContaining(["slot", "slot_lever", "slot_logo", "slot_number_1", "slot_number_2"])
  );
  expect(
    document.nodes.find((node: { name: string }) => node.name === "slot_number_2").translation[2]
  ).toBeGreaterThan(0);
  expect(
    document.nodes.find((node: { name: string }) => node.name === "slot_number_1").translation[2]
  ).toBeLessThan(0);
  expect(
    document.images.every(
      (image: { uri?: string; bufferView?: number }) => !image.uri && image.bufferView !== undefined
    )
  ).toBe(true);
  expect(document.buffers.every((buffer: { uri?: string }) => !buffer.uri)).toBe(true);
});
