import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

import { AppQueryProvider } from "@app/providers/AppQueryProvider";
import "@shared/styles/tokens.css";
import { AppToastProvider } from "@shared/ui/toast";

import { readIntroLayoutStageView } from "./introLayoutEditorConfig";

import "../../src/style.css";

async function loadIntroLayoutEditorRoot(): Promise<ReactElement> {
  const stageView = readIntroLayoutStageView(window.location.search);

  if (!stageView) {
    const { IntroLayoutEditor } = await import("./IntroLayoutEditor");

    return <IntroLayoutEditor />;
  }

  const { IntroLayoutStage } = await import("./IntroLayoutStage");

  return (
    <AppQueryProvider>
      <AppToastProvider>
        <IntroLayoutStage view={stageView} />
      </AppToastProvider>
    </AppQueryProvider>
  );
}

const app = document.getElementById("app");

if (!app) {
  throw new Error("App root not found");
}

void loadIntroLayoutEditorRoot().then((root) => {
  createRoot(app).render(<StrictMode>{root}</StrictMode>);
});
