import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppQueryProvider } from "@app/providers/AppQueryProvider";
import { AppRouter } from "@app/router/AppRouter";
import "@shared/styles/tokens.css";
import "./style.css";

const app = document.getElementById("app");

if (!app) {
  throw new Error("App root not found");
}

createRoot(app).render(
  <StrictMode>
    <AppQueryProvider>
      <AppRouter />
    </AppQueryProvider>
  </StrictMode>
);
