import { StrictMode, type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { loadPreviousEntryEditionIds } from "../data/entryEditionSelectionStorage";
import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { useEntryEditionSelection } from "./useEntryEditionSelection";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

test("waits for data and keeps the selected records through query refreshes and StrictMode", async () => {
  const { result, rerender } = renderHook<
    ReturnType<typeof useEntryEditionSelection>,
    { source: readonly EntryEditionPlace[] | undefined }
  >(
    ({ source }: { source: readonly EntryEditionPlace[] | undefined }) =>
      useEntryEditionSelection(source),
    {
      initialProps: { source: undefined },
      wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
    }
  );
  expect(result.current).toBeNull();
  rerender({ source: ENTRY_TEST_PLACES });
  await waitFor(() => expect(result.current).toHaveLength(2));
  const selected = result.current;
  rerender({ source: ENTRY_TEST_PLACES.map((place) => ({ ...place, name: "updated" })) });
  expect(result.current).toBe(selected);
  expect(loadPreviousEntryEditionIds()).toEqual(selected?.map((place) => place.id));
});

test("avoids the previous visit after remount even when StrictMode replays effects", async () => {
  const source = Array.from({ length: 25 }, (_, index) => ({
    ...ENTRY_TEST_PLACES[0],
    id: `place-${index}`,
  }));
  const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
  const first = renderHook(() => useEntryEditionSelection(source), { wrapper });
  await waitFor(() => expect(first.result.current).toHaveLength(10));
  const ids = first.result.current!.map((place) => place.id);
  first.unmount();
  const second = renderHook(() => useEntryEditionSelection(source), { wrapper });
  await waitFor(() => expect(second.result.current).toHaveLength(10));
  expect(second.result.current!.every((place) => !ids.includes(place.id))).toBe(true);
});

test("still selects places when localStorage is blocked", async () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new Error("denied");
  });
  const { result } = renderHook(() => useEntryEditionSelection(ENTRY_TEST_PLACES));
  await waitFor(() => expect(result.current).toHaveLength(2));
});
