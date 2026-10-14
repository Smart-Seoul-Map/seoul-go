import type { AnalyticsClient, AnalyticsEvent } from "./analyticsEvents";

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
const LOCAL_BUILD_LABEL = "local";

let client: AnalyticsClient | null = null;

export function initAnalytics(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const branch = import.meta.env.CF_PAGES_BRANCH;
  const isAnalyticsBranch = branch === "dev" || branch === "main";

  if (!apiKey || !isAnalyticsBranch) {
    return;
  }

  void import("./posthogAnalyticsClient").then(({ createPosthogAnalyticsClient }) => {
    client = createPosthogAnalyticsClient({
      apiKey,
      apiHost: import.meta.env.VITE_POSTHOG_HOST || DEFAULT_POSTHOG_HOST,
      appCommit: import.meta.env.CF_PAGES_COMMIT_SHA || LOCAL_BUILD_LABEL,
      appBranch: branch,
    });
  });
}

export function track(event: AnalyticsEvent): void {
  client?.capture(event);
}

export function captureError(error: unknown): void {
  client?.captureError(error);
}
