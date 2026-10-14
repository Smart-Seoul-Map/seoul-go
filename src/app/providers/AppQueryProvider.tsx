import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren, ReactElement } from "react";

import { captureError } from "@shared/lib/analytics/analytics";

const appQueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => captureError(error),
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppQueryProvider({ children }: PropsWithChildren): ReactElement {
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
