import { expect, test, type Page } from "@playwright/test";

const REWARD_STORAGE_KEY = "seoul-go:entry-number-rewards:v1";

async function startExploration(page: Page) {
  const start = page.getByRole("button", { name: "탐방 시작", exact: true });
  await expect(start).toBeEnabled({ timeout: 45000 });
  await start.click();
  const canvas = page.getByLabel("서울 탐방 공간", { exact: true });
  await expect(canvas).not.toHaveAttribute("aria-busy", "true", { timeout: 45000 });
  await expect(canvas).toBeEnabled();
  return canvas;
}

async function readRewards(page: Page): Promise<{ placeId: string; number: number }[]> {
  return page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").rewards ?? [],
    REWARD_STORAGE_KEY
  );
}

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
  { name: "desktop", width: 1366, height: 900, x: 1242, y: 650, touch: false },
  { name: "mobile", width: 390, height: 844, x: 371, y: 801, touch: true },
  { name: "narrow", width: 320, height: 640, x: 304, y: 608, touch: true },
]) {
  test.describe(viewport.name, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
    });
    test("visits a place, automatically spins once, and keeps the number after reload", async ({
      page,
    }, testInfo) => {
      test.setTimeout(150000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (new URL(response.url()).pathname.startsWith("/models/") && !response.ok())
          errors.push(`${response.status()} model`);
      });
      await page.goto("/");
      const canvas = await startExploration(page);
      if (viewport.touch) await canvas.tap({ position: { x: viewport.x, y: viewport.y } });
      else await canvas.click({ position: { x: viewport.x, y: viewport.y } });
      const panel = page.getByRole("dialog", { name: "한옥체험", exact: true });
      await expect(panel).toBeVisible({ timeout: 20000 });
      const titleBounds = await panel
        .getByRole("heading", { name: "한옥체험", exact: true })
        .boundingBox();
      const closeBounds = await panel.getByRole("button", { name: "장소 정보 닫기" }).boundingBox();
      expect(titleBounds && closeBounds).toBeTruthy();
      expect(
        Math.abs(
          closeBounds!.y + closeBounds!.height / 2 - titleBounds!.y - titleBounds!.height / 2
        )
      ).toBeLessThan(2);
      const awarded = await readRewards(page);
      expect(awarded).toHaveLength(1);
      expect(awarded[0]).toEqual({ placeId: "hanok", number: expect.any(Number) });
      expect(awarded[0].number).toBeGreaterThanOrEqual(36);
      expect(awarded[0].number).toBeLessThanOrEqual(71);
      await expect(page.getByRole("button", { name: "내 번호 열기, 0개 획득" })).toBeVisible();
      const clip = {
        x: viewport.width * 0.4,
        y: viewport.height * 0.28,
        width: viewport.width * 0.2,
        height: viewport.height * 0.16,
      };
      const before = await page.screenshot({ clip });
      if (viewport.touch) {
        await canvas.tap({ position: { x: viewport.width / 2, y: 100 } });
      } else {
        await panel.getByRole("button", { name: "장소 정보 닫기" }).click();
      }
      await expect(panel).toHaveCount(0);
      const result = page.getByRole("status", { name: "뽑힌 숫자" });
      const close = page.getByRole("button", { name: "슬롯 닫기" });
      await expect(page.getByRole("region", { name: "숫자 슬롯" })).toBeVisible();
      // Sample the phase and its controls together; browser round trips can outlast a spin.
      const phase = await page.getByRole("region", { name: "숫자 슬롯" }).evaluate((element) => {
        const busy = element.querySelector("output")?.getAttribute("aria-busy") === "true";
        const closeButton = element.querySelector<HTMLButtonElement>(
          'button[aria-label="슬롯 닫기"]'
        );
        const buttons = element.querySelectorAll("button");
        return { busy, disabled: closeButton?.disabled, buttonCount: buttons.length };
      });
      expect(phase.disabled).toBe(phase.busy);
      expect(phase.buttonCount).toBe(phase.busy ? 1 : 2);
      await canvas.click({ position: { x: viewport.width / 2, y: viewport.height * 0.4 } });
      await expect(close).toBeEnabled({ timeout: 15000 });
      expect(
        (await page.screenshot({ clip })).equals(before),
        "The automatic slot presentation changes the scene pixels"
      ).toBe(false);
      await expect(canvas).toHaveCSS("opacity", "1");
      await expect(result).toHaveText(String(awarded[0].number));
      await expect(page.getByRole("heading", { name: "숫자 슬롯", exact: true })).toHaveCount(0);
      const slotCloseBounds = await close.boundingBox();
      expect(slotCloseBounds).not.toBeNull();
      expect(slotCloseBounds!.y).toBeCloseTo(12, 0);
      expect(viewport.width - slotCloseBounds!.x - slotCloseBounds!.width).toBeCloseTo(16, 0);
      await expect(page.getByRole("button", { name: /돌리기/ })).toHaveCount(0);
      await expect(page.getByRole("alert")).toHaveCount(0);
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
      const summary = await page.locator(".entry-slot-summary").boundingBox();
      expect(summary!.y).toBeGreaterThanOrEqual(0);
      expect(summary!.y + summary!.height).toBeLessThan(controls!.y);
      await testInfo.attach("slot-result", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await page.getByRole("button", { name: "계속 탐방하기" }).click();
      await expect(page.getByRole("region", { name: "숫자 슬롯" })).toHaveCount(0);
      await expect(canvas).toHaveCSS("opacity", "1");
      await expect(panel).toHaveCount(0);
      await page.getByRole("button", { name: "내 번호 열기, 1개 획득" }).click();
      await expect(page.getByRole("list", { name: "획득한 숫자" })).toHaveText(
        `추첨 번호${awarded[0].number}`
      );
      expect(await readRewards(page)).toEqual(awarded);
      await page.reload();
      await startExploration(page);
      await expect(page.getByRole("region", { name: "숫자 슬롯" })).toHaveCount(0);
      await page.getByRole("button", { name: "내 번호 열기, 1개 획득" }).click();
      await expect(page.getByRole("list", { name: "획득한 숫자" })).toHaveText(
        `추첨 번호${awarded[0].number}`
      );
      expect(errors).toEqual([]);
    });
  });
}

for (const phase of ["card", "spinning"] as const) {
  test(`refreshing during ${phase} keeps the number without resuming the slot`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");
    const canvas = await startExploration(page);
    await canvas.click({ position: { x: 1242, y: 650 } });
    await expect(page.getByRole("dialog", { name: "한옥체험", exact: true })).toBeVisible({
      timeout: 20000,
    });
    const [reward] = await readRewards(page);
    if (phase === "spinning") {
      await page.getByRole("button", { name: "장소 정보 닫기" }).click();
      await expect(page.getByRole("status", { name: "뽑힌 숫자" })).toHaveAttribute(
        "aria-busy",
        "true"
      );
    }
    await page.reload();
    await startExploration(page);
    await expect(page.getByRole("region", { name: "숫자 슬롯" })).toHaveCount(0);
    await expect(page.locator('.PlaceDetailPanel[data-state="open"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "내 번호 열기, 1개 획득" })).toBeVisible();
    await page.getByRole("button", { name: "내 번호 열기, 1개 획득" }).click();
    await expect(page.getByRole("list", { name: "획득한 숫자" })).toHaveText(
      `추첨 번호${reward.number}`
    );
    expect(await readRewards(page)).toEqual([reward]);
    await testInfo.attach("restored-place", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

test("model loading failure still reveals the earned number and allows closing", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/models/slot_v1.glb", (route) => route.abort());
  await page.goto("/");
  const canvas = await startExploration(page);
  await canvas.click({ position: { x: 371, y: 801 } });
  await expect(page.getByRole("dialog", { name: "한옥체험", exact: true })).toBeVisible({
    timeout: 20000,
  });
  const [reward] = await readRewards(page);
  await page.getByRole("button", { name: "장소 정보 닫기" }).click();
  await expect(page.getByRole("alert")).toContainText("번호는 받았어요");
  await expect(page.getByRole("status", { name: "뽑힌 숫자" })).toHaveText(String(reward.number));
  await page.getByRole("button", { name: "슬롯 닫기" }).click();
  await expect(page.getByRole("button", { name: "내 번호 열기, 1개 획득" })).toBeVisible();
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
