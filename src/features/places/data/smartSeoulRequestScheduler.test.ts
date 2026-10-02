import { expect, test, vi } from "vitest";

import { withSmartSeoulRequestSlot } from "./smartSeoulRequestScheduler";

test("aborted queued requests never start and leave the budget reusable", async () => {
  const release: (() => void)[] = [];
  const occupy = () =>
    withSmartSeoulRequestSlot(() => new Promise<void>((resolve) => release.push(resolve)));
  const first = occupy();
  const second = occupy();
  await vi.waitFor(() => expect(release).toHaveLength(2));
  const controller = new AbortController();
  const request = vi.fn(async () => "unexpected");
  const queued = withSmartSeoulRequestSlot(request, controller.signal);
  const rejected = expect(queued).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await rejected;
  release.forEach((finish) => finish());
  await Promise.all([first, second]);
  expect(request).not.toHaveBeenCalled();
  await expect(withSmartSeoulRequestSlot(async () => "next")).resolves.toBe("next");
});

test("failed requests release their slots", async () => {
  await expect(
    withSmartSeoulRequestSlot(async () => {
      throw new Error("offline");
    })
  ).rejects.toThrow("offline");
  await expect(withSmartSeoulRequestSlot(async () => "next")).resolves.toBe("next");
});
