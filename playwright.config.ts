import { defineConfig, devices } from "@playwright/test";

const previewPort = 4173;
const previewHost = "127.0.0.1";
const previewUrl = `http://${previewHost}:${previewPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: previewUrl,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "off",
  },
  webServer: {
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
