import type { ReactElement } from "react";

import { AppTextButton } from "../button";

import type { AppToastItem } from "./toastTypes";

export type AppToastProps = {
  onAction: () => void;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onPointerUp: () => void;
  toast: AppToastItem;
};

export function AppToast({
  onAction,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  toast,
}: AppToastProps): ReactElement {
  const role = toast.status === "error" ? "alert" : "status";
  const ariaLive = toast.status === "error" ? "assertive" : "polite";

  return (
    <div
      aria-live={ariaLive}
      className="AppToast"
      data-status={toast.status}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerUp}
      role={role}
    >
      <div className="AppToastMessage">{toast.message}</div>
      {toast.actionLabel && (
        <AppTextButton onClick={onAction} variant="brand">
          {toast.actionLabel}
        </AppTextButton>
      )}
    </div>
  );
}
