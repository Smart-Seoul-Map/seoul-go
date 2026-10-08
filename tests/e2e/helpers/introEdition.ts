import { Buffer } from "node:buffer";
import type { Page } from "@playwright/test";

export const INTRO_PLACE_NAME = "해방촌신흥시장";
export const INTRO_PLACE_ID = "smart-seoul:1786321258890:25_edition25_24";
const INTRO_PLACE_MODEL_PATH = "**/models/places/namsan_baekbeom_square.glb";

export async function mockIntroEdition(page: Page): Promise<void> {
  await page.route("**/openapi/v5/**/public/themes/contents/ko?**", async (route) => {
    const themeId = new URL(route.request().url()).searchParams.get("theme_id");
    const body =
      themeId === "1786321258890"
        ? [
            {
              COT_THEME_ID: themeId,
              COT_CONTS_ID: "25_edition25_24",
              COT_CONTS_NAME: INTRO_PLACE_NAME,
              COT_GU_NAME: "용산구",
              COT_COORD_X: 126.985085516,
              COT_COORD_Y: 37.54532375,
              COT_VALUE_01: "오래된 시장에 새로움을 입힌 개성 가득한 복합문화 공간",
              COT_ADDR_FULL_NEW: "서울특별시 용산구 신흥로 95-9",
              COT_IMG_MAIN_URL: "/test-entry-place.png",
            },
          ]
        : [];
    await route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: {
        header: {
          resultCode: "200",
          PAGE_NO: "1",
          PAGE_COUNT: "1",
          PAGE_SIZE: "100",
          TOTAL_COUNT: String(body.length),
          DATA_COUNT: String(body.length),
        },
        body,
      },
    });
  });
  await page.route(INTRO_PLACE_MODEL_PATH, (route) =>
    route.fulfill({ contentType: "model/gltf-binary", body: "not a glb" })
  );
  await page.route("**/test-entry-place.png", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64"
      ),
    })
  );
}

export async function approachIntroPlace(page: Page): Promise<void> {
  await page.getByRole("button", { name: `${INTRO_PLACE_NAME} 방문`, exact: true }).click();
}
