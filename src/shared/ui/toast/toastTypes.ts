import type { ReactNode } from "react";

export type AppToastStatus = "info" | "success" | "error";

export type AppToastOptions = {
  actionLabel?: string;
  durationMs?: number;
  message: ReactNode;
  onAction?: () => void;
  status?: AppToastStatus;
};

export type AppToastItem = Required<Pick<AppToastOptions, "durationMs" | "status">> &
  Omit<AppToastOptions, "durationMs" | "status"> & {
    id: string;
  };

export type AppToastApi = {
  clearToasts: () => void;
  dismissToast: (toastId: string) => void;
  showToast: (options: AppToastOptions) => string;
};
