import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren, ReactElement } from "react";

const appQueryClient = new QueryClient({
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
