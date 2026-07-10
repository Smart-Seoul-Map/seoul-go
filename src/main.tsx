import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@app/App";
import { AppQueryProvider } from "@app/providers/AppQueryProvider";
import "./style.css";

const app = document.getElementById("app");

if (!app) {
  throw new Error("App root not found");
}

createRoot(app).render(
  <StrictMode>
    <AppQueryProvider>
      <App />
    </AppQueryProvider>
  </StrictMode>
);
