import { StrictMode, type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { ENTRY_EDITION_MODELS } from "../config/entryEditionModels";
import { ENTRY_MODELED_TEST_PLACES, ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { useEntryEditionSelection } from "./useEntryEditionSelection";

const modeledIdsBySlot = Object.entries(ENTRY_EDITION_MODELS)
  .sort(([, left], [, right]) => left.editionIndex - right.editionIndex)
  .map(([id]) => id);

afterEach(() => {
  cleanup();
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
  rerender({ source: ENTRY_MODELED_TEST_PLACES });
  await waitFor(() => expect(result.current).toHaveLength(ENTRY_MODELED_TEST_PLACES.length));
  const selected = result.current;
  rerender({ source: ENTRY_MODELED_TEST_PLACES.map((place) => ({ ...place, name: "updated" })) });
  expect(result.current).toBe(selected);
});

test("selects only places with a GLB model in their edition slot order", async () => {
  const source = [
    ENTRY_TEST_PLACES[0],
    ...[...ENTRY_MODELED_TEST_PLACES].reverse(),
    ENTRY_TEST_PLACES[1],
  ];
  const { result } = renderHook(() => useEntryEditionSelection(source));
  await waitFor(() => expect(result.current).toHaveLength(modeledIdsBySlot.length));
  expect(result.current!.map((place) => place.id)).toEqual(modeledIdsBySlot);
});

test("selects nothing when no place in the response has a GLB model", async () => {
  const { result } = renderHook(() => useEntryEditionSelection(ENTRY_TEST_PLACES));
  await waitFor(() => expect(result.current).toEqual([]));
});

test("selects the same places in the same order after a remount", async () => {
  const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
  const first = renderHook(() => useEntryEditionSelection(ENTRY_MODELED_TEST_PLACES), { wrapper });
  await waitFor(() => expect(first.result.current).toHaveLength(modeledIdsBySlot.length));
  const ids = first.result.current!.map((place) => place.id);
  first.unmount();
  const second = renderHook(() => useEntryEditionSelection(ENTRY_MODELED_TEST_PLACES), {
    wrapper,
  });
  await waitFor(() => expect(second.result.current).toHaveLength(modeledIdsBySlot.length));
  expect(second.result.current!.map((place) => place.id)).toEqual(ids);
});
