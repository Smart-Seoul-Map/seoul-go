import { afterEach, describe, expect, test, vi } from "vitest";

const { capture, createPosthogAnalyticsClient } = vi.hoisted(() => {
  const capture = vi.fn();
  return {
    capture,
    createPosthogAnalyticsClient: vi.fn(() => ({ capture, captureError: vi.fn() })),
  };
});

vi.mock("./posthogAnalyticsClient", () => ({ createPosthogAnalyticsClient }));

async function loadAnalytics() {
  vi.resetModules();
  return import("./analytics");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("analytics", () => {
  test("does not load PostHog and ignores events without a key", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    const { initAnalytics, track } = await loadAnalytics();

    initAnalytics();
    await vi.dynamicImportSettled();
    track({ name: "entry_intro_start" });

    expect(createPosthogAnalyticsClient).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  test("does not load PostHog on a feature branch build even with a key", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    vi.stubEnv("CF_PAGES_BRANCH", "setting/152-posthog-analytics");
    const { initAnalytics, track } = await loadAnalytics();

    initAnalytics();
    await vi.dynamicImportSettled();
    track({ name: "entry_intro_start" });

    expect(createPosthogAnalyticsClient).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  test("sends events with the build commit and branch on the dev build", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    vi.stubEnv("CF_PAGES_COMMIT_SHA", "abc1234");
    vi.stubEnv("CF_PAGES_BRANCH", "dev");
    const { initAnalytics, track } = await loadAnalytics();

    initAnalytics();
    await vi.dynamicImportSettled();
    track({ name: "entry_place_visit", placeId: "place-1", rewarded: true });

    expect(createPosthogAnalyticsClient).toHaveBeenCalledWith({
      apiKey: "phc_test",
      apiHost: "https://us.i.posthog.com",
      appCommit: "abc1234",
      appBranch: "dev",
    });
    expect(capture).toHaveBeenCalledWith({
      name: "entry_place_visit",
      placeId: "place-1",
      rewarded: true,
    });
  });
});
