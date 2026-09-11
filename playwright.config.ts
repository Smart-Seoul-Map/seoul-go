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
