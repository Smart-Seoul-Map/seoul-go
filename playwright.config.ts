import { defineConfig, devices } from "@playwright/test";

const previewPort = 4173;
const previewHost = "127.0.0.1";
const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://${previewHost}:${previewPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  workers: 1,
  reporter: [[process.env.CI ? "github" : "list"], ["html", { open: "never" }]],
  use: {
    baseURL: previewUrl,
    // 첫 진입 가이드 '봤음' 값을 넣고 시작한다. 가이드는 이제 이 값과 무관하게 방문마다 해치가 처음 멈출 때 열려
    // 이 값으로는 막지 못하고, startIntro helper가 닫는다. '봤음' 저장을 지울 때 이 값도 함께 지운다.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(previewUrl).origin,
          localStorage: [{ name: "seoul-go:entry-guide-seen:v1", value: "1" }],
        },
      ],
    },
    channel: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: process.env.PLAYWRIGHT_VIDEO === "1" ? "retain-on-failure" : "off",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `node ./node_modules/vite/bin/vite.js preview --host ${previewHost} --port ${previewPort}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: previewUrl,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-gpu", "--disable-dev-shm-usage"],
        },
      },
    },
  ],
});
