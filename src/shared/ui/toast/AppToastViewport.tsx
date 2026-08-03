import { createPortal } from "react-dom";
import type { ReactElement } from "react";

import { AppToast } from "./AppToast";
import type { AppToastItem } from "./toastTypes";

export type AppToastViewportProps = {
  onAction: () => void;
  onPause: () => void;
  onResume: () => void;
  toast: AppToastItem | null;
};

function getToastPortalRoot(): HTMLElement {
  return document.body;
}

export function AppToastViewport({
  onAction,
  onPause,
  onResume,
  toast,
}: AppToastViewportProps): ReactElement | null {
  if (!toast) {
    return null;
  }

  return createPortal(
    <div className="AppToastViewport">
      <AppToast
        onAction={onAction}
        onPointerDown={onPause}
        onPointerEnter={onPause}
        onPointerLeave={onResume}
        onPointerUp={onResume}
        toast={toast}
      />
    </div>,
    getToastPortalRoot()
  );
}
