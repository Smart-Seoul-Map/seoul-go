import { expect, test } from "@playwright/test";

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

for (const viewport of [
  { name: "desktop", width: 1366, height: 900, x: 543, y: 450, touch: false },
  { name: "mobile", width: 390, height: 844, x: 64, y: 410, touch: true },
  { name: "narrow", width: 320, height: 640, x: 60, y: 311, touch: true },
]) {
  test.describe(viewport.name, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
    });
    test("approaches, spins the real model, retries, and exits", async ({ page }, testInfo) => {
      test.setTimeout(90000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (new URL(response.url()).pathname.startsWith("/models/") && !response.ok())
          errors.push(`${response.status()} model`);
      });
      await page.goto("/");
      const start = page.getByRole("button", { name: "탐방 시작", exact: true });
      await expect(start).toBeEnabled({ timeout: 45000 });
      await start.click();
      const canvas = page.getByLabel("서울 탐방 공간", { exact: true });
      await expect(canvas).toBeVisible({ timeout: 20000 });
      if (viewport.touch) await canvas.tap({ position: { x: viewport.x, y: viewport.y } });
      else await canvas.click({ position: { x: viewport.x, y: viewport.y } });
      const spin = page.getByRole("button", { name: "돌리기", exact: true });
      await expect(spin).toBeEnabled({ timeout: 15000 });
      const clip = {
        x: viewport.width * 0.4,
        y: viewport.height * 0.28,
        width: viewport.width * 0.2,
        height: viewport.height * 0.16,
      };
      const before = await page.screenshot({ clip });
      if (viewport.touch)
        await canvas.tap({ position: { x: viewport.width / 2, y: viewport.height * 0.4 } });
      else await canvas.click({ position: { x: viewport.width / 2, y: viewport.height * 0.4 } });
      await expect(page.getByRole("button", { name: "돌아가는 중" })).toBeDisabled();
      const during = await page.screenshot({ clip });
      expect(during.equals(before), "Reel pixels change while spinning").toBe(false);
      const retry = page.getByRole("button", { name: "다시 돌리기" });
      await expect(retry).toBeEnabled({ timeout: 10000 });
      await expect(page.getByRole("status", { name: "뽑힌 숫자" })).toHaveText(/^\d{2}$/);
      const pixels = await canvas.evaluate(
        (element: HTMLCanvasElement) =>
          new Promise<number>((resolve) => {
            requestAnimationFrame(() => {
              const gl = element.getContext("webgl2");
              if (!gl) return resolve(0);
              const data = new Uint8Array(element.width * element.height * 4);
              gl.readPixels(0, 0, element.width, element.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
              let colored = 0;
              for (let i = 0; i < data.length; i += 64) {
                if (
                  data[i + 3] > 0 &&
                  Math.max(data[i], data[i + 1], data[i + 2]) -
                    Math.min(data[i], data[i + 1], data[i + 2]) >
                    40
                )
                  colored++;
              }
              resolve(colored);
            });
          })
      );
      expect(pixels, "Canvas contains textured colored geometry").toBeGreaterThan(100);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow).toBe(false);
      const controls = await page.locator(".entry-slot-controls").boundingBox();
      expect(controls!.y + controls!.height).toBeLessThanOrEqual(viewport.height);
      await testInfo.attach("slot-result", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await retry.click();
      await expect(page.getByRole("button", { name: "돌아가는 중" })).toBeDisabled();
      await page.getByRole("button", { name: "슬롯 닫기" }).click();
      await expect(page.getByRole("region", { name: "숫자 슬롯" })).toHaveCount(0);
      await page.waitForTimeout(1000);
      await expect(page.getByRole("region", { name: "숫자 슬롯" })).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  });
}

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
