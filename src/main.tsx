import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppQueryProvider } from "@app/providers/AppQueryProvider";
import { AppRouter } from "@app/router/AppRouter";
import { initAnalytics } from "@shared/lib/analytics/analytics";
import "@shared/styles/tokens.css";
import { AppToastProvider } from "@shared/ui/toast";
import "./style.css";

const app = document.getElementById("app");

if (!app) {
  throw new Error("App root not found");
}

initAnalytics();

createRoot(app).render(
  <StrictMode>
    <AppQueryProvider>
      <AppToastProvider>
        <AppRouter />
      </AppToastProvider>
    </AppQueryProvider>
  </StrictMode>
);
