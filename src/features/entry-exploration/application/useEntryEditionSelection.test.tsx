import { StrictMode, type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import type { EntryEditionModel } from "../config/entryEditionModels";
import { ENTRY_MODELED_TEST_PLACES, ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { loadPreviousEntryEditionIds } from "../data/entryEditionSelectionStorage";
import type { EntryEditionPlace } from "../domain/entryEditionPlace";
import { useEntryEditionSelection } from "./useEntryEditionSelection";

const models = vi.hoisted(() => ({
  map: {} as Record<string, EntryEditionModel>,
  extraIds: [] as string[],
}));
vi.mock("../config/entryEditionModels", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/entryEditionModels")>();
  Object.assign(models.map, actual.ENTRY_EDITION_MODELS);
  return { ...actual, ENTRY_EDITION_MODELS: models.map };
});

const modeledIds = ENTRY_MODELED_TEST_PLACES.map((place) => place.id);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  models.extraIds.forEach((id) => delete models.map[id]);
  models.extraIds = [];
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
  expect(loadPreviousEntryEditionIds()).toEqual(selected?.map((place) => place.id));
});

test("selects only places with a GLB model and excludes places without one", async () => {
  const source = [ENTRY_TEST_PLACES[0], ...ENTRY_MODELED_TEST_PLACES, ENTRY_TEST_PLACES[1]];
  const { result } = renderHook(() => useEntryEditionSelection(source));
  await waitFor(() => expect(result.current).toHaveLength(modeledIds.length));
  const selectedIds = result.current!.map((place) => place.id);
  expect([...selectedIds].sort()).toEqual([...modeledIds].sort());
  expect(selectedIds).not.toContain(ENTRY_TEST_PLACES[0].id);
  expect(selectedIds).not.toContain(ENTRY_TEST_PLACES[1].id);
  expect([...loadPreviousEntryEditionIds()].sort()).toEqual([...modeledIds].sort());
});

test("selects nothing when no place in the response has a GLB model", async () => {
  const { result } = renderHook(() => useEntryEditionSelection(ENTRY_TEST_PLACES));
  await waitFor(() => expect(result.current).toEqual([]));
});

test("caps the selection at ten modeled places even when more GLB places exist", async () => {
  const extra = Array.from({ length: 12 }, (_, index) => ({
    ...ENTRY_TEST_PLACES[0],
    id: `modeled-place-${index}`,
  }));
  registerExtraModels(extra.map((place) => place.id));
  const source = [...ENTRY_TEST_PLACES, ...ENTRY_MODELED_TEST_PLACES, ...extra];
  const { result } = renderHook(() => useEntryEditionSelection(source));
  await waitFor(() => expect(result.current).toHaveLength(10));
  expect(result.current!.every((place) => Object.hasOwn(models.map, place.id))).toBe(true);
});

test("avoids the previous visit after remount even when StrictMode replays effects", async () => {
  const source = Array.from({ length: 25 }, (_, index) => ({
    ...ENTRY_TEST_PLACES[0],
    id: `place-${index}`,
  }));
  registerExtraModels(source.map((place) => place.id));
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
  const { result } = renderHook(() => useEntryEditionSelection(ENTRY_MODELED_TEST_PLACES));
  await waitFor(() => expect(result.current).toHaveLength(ENTRY_MODELED_TEST_PLACES.length));
});

function registerExtraModels(ids: readonly string[]) {
  for (const id of ids) {
    models.map[id] = { url: `/models/test/${id}.glb`, size: 1, rotationY: 0 };
    models.extraIds.push(id);
  }
}
