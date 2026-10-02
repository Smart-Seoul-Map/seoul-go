import { SMART_SEOUL_THEME_REQUEST_CONCURRENCY } from "../config/smartSeoulThemeApiConfig";

let activeRequests = 0;
const waiting: (() => void)[] = [];

function acquireSlot(signal?: AbortSignal): Promise<() => void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const start = () => {
      signal?.removeEventListener("abort", cancel);
      activeRequests++;
      resolve(() => {
        activeRequests--;
        waiting.shift()?.();
      });
    };
    const cancel = () => {
      const index = waiting.indexOf(start);
      if (index !== -1) waiting.splice(index, 1);
      reject(signal?.reason);
    };
    if (activeRequests < SMART_SEOUL_THEME_REQUEST_CONCURRENCY) {
      start();
    } else {
      waiting.push(start);
      signal?.addEventListener("abort", cancel, { once: true });
    }
  });
}

// Share the budget across catalog, station availability and linked-place queries.
export async function withSmartSeoulRequestSlot<T>(
  request: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  const release = await acquireSlot(signal);
  try {
    signal?.throwIfAborted();
    return await request();
  } finally {
    release();
  }
}
