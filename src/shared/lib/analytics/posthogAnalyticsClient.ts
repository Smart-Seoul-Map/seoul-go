import posthog from "posthog-js";

import type { AnalyticsClient } from "./analyticsEvents";

type PosthogAnalyticsClientOptions = {
  apiKey: string;
  apiHost: string;
  appCommit: string;
  appBranch: string;
};

export function createPosthogAnalyticsClient({
  apiKey,
  apiHost,
  appCommit,
  appBranch,
}: PosthogAnalyticsClientOptions): AnalyticsClient {
  posthog.init(apiKey, {
    api_host: apiHost,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    capture_exceptions: true,
  });
  posthog.register({ app_commit: appCommit, app_branch: appBranch });

  return {
    capture: ({ name, ...properties }) => {
      posthog.capture(name, properties);
    },
    captureError: (error) => {
      posthog.captureException(error);
    },
  };
}
