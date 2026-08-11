import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { AppToastViewport } from "./AppToastViewport";
import type { AppToastApi, AppToastItem, AppToastOptions } from "./toastTypes";

import "./toast.css";

const DEFAULT_TOAST_DURATION_MS = 4000;

const AppToastContext = createContext<AppToastApi | null>(null);

let toastSequence = 0;

function createToast(options: AppToastOptions): AppToastItem {
  toastSequence += 1;

  return {
    ...options,
    durationMs: options.durationMs ?? DEFAULT_TOAST_DURATION_MS,
    id: `app-toast-${toastSequence}`,
    status: options.status ?? "info",
  };
}

export type AppToastProviderProps = {
  children: ReactNode;
};

export function AppToastProvider({ children }: AppToastProviderProps): ReactElement {
  const [activeToast, setActiveToast] = useState<AppToastItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const activeToastRef = useRef<AppToastItem | null>(null);

  useEffect(() => {
    activeToastRef.current = activeToast;
  }, [activeToast]);

  const showToast = useCallback((options: AppToastOptions): string => {
    const toast = createToast(options);

    setActiveToast(toast);
    setIsPaused(false);

    return toast.id;
  }, []);

  const dismissToast = useCallback((toastId: string): void => {
    setActiveToast((currentToast) => (currentToast?.id === toastId ? null : currentToast));
    setIsPaused(false);
  }, []);

  const clearToasts = useCallback((): void => {
    setActiveToast(null);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (!activeToast || isPaused) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissToast(activeToast.id);
    }, activeToast.durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeToast, dismissToast, isPaused]);

  const handleAction = useCallback(() => {
    const toast = activeToastRef.current;

    toast?.onAction?.();

    if (toast) {
      dismissToast(toast.id);
    }
  }, [dismissToast]);

  const toastApi = useMemo(
    () => ({
      clearToasts,
      dismissToast,
      showToast,
    }),
    [clearToasts, dismissToast, showToast]
  );

  return (
    <AppToastContext.Provider value={toastApi}>
      {children}
      <AppToastViewport
        onAction={handleAction}
        onPause={() => setIsPaused(true)}
        onResume={() => setIsPaused(false)}
        toast={activeToast}
      />
    </AppToastContext.Provider>
  );
}

export function useAppToast(): AppToastApi {
  const toastApi = useContext(AppToastContext);

  if (!toastApi) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }

  return toastApi;
}
