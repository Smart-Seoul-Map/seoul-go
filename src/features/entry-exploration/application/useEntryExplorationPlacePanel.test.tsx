import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";

import { useEntryExplorationPlacePanel } from "./useEntryExplorationPlacePanel";
import { createEntryNumberRewardStore } from "./entryNumberRewardStore";
import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
const FIRST_PLACE_ID = ENTRY_TEST_PLACES[0].id;
const SECOND_PLACE_ID = ENTRY_TEST_PLACES[1].id;

test("opens hanok within its original four-unit radius and dismisses it without granting a reward", () => {
  const store = createEntryNumberRewardStore({ storage: null, random: () => 0 });
  const dismissed: string[] = [];
  const { result } = renderHook(() =>
    useEntryExplorationPlacePanel(ENTRY_TEST_PLACES, {
      onVisit: store.getState().visitPlace,
      onDismiss: (placeId) => dismissed.push(placeId),
    })
  );
  act(() => {
    result.current.placeVisits.hanok.update({ x: 3.9, z: 0 }, { x: 0, z: 0 });
  });
  expect(result.current.panelProps).toMatchObject({ placeId: "hanok", open: true });
  expect(store.getState().rewards).toEqual([]);
  expect(dismissed).toEqual([]);
  act(() => result.current.panelProps.onClose());
  expect(dismissed).toEqual(["hanok"]);
  act(() => {
    result.current.placeVisits.hanok.update({ x: 10, z: 0 }, { x: 0, z: 0 });
    result.current.placeVisits.hanok.update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  expect(result.current.panelProps.open).toBe(true);
  expect(store.getState().rewards).toEqual([]);
});

test("awards on arrival but starts presentation only on explicit card dismissal", () => {
  const store = createEntryNumberRewardStore({ storage: null, random: () => 0 });
  const dismissed: string[] = [];
  const { result } = renderHook(() =>
    useEntryExplorationPlacePanel(ENTRY_TEST_PLACES, {
      onVisit: store.getState().visitPlace,
      onDismiss: (placeId) => {
        dismissed.push(placeId);
      },
    })
  );
  act(() => {
    result.current.placeVisits[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
  });
  expect(result.current.panelProps.open).toBe(true);
  expect(store.getState().rewards).toEqual([{ placeId: FIRST_PLACE_ID, number: 36 }]);
  act(() => {
    result.current.placeVisits[FIRST_PLACE_ID].dismiss();
  });
  expect(dismissed).toEqual([]);
  act(() => {
    result.current.placeVisits[FIRST_PLACE_ID].update({ x: 30, z: 20 }, { x: 10, z: 20 });
    result.current.placeVisits[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
  });
  act(() => result.current.panelProps.onClose());
  expect(dismissed).toEqual([FIRST_PLACE_ID]);
  expect(store.getState().rewards).toHaveLength(1);
});

test("does not recreate place visit controllers when callbacks change", () => {
  const { result, rerender } = renderHook(
    ({ label }) =>
      useEntryExplorationPlacePanel(ENTRY_TEST_PLACES, {
        onDismiss: () => {
          calls.push(label);
        },
      }),
    { initialProps: { label: "old" } }
  );
  const calls: string[] = [];
  const visits = result.current.placeVisits;
  act(() => {
    visits[SECOND_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  rerender({ label: "new" });
  act(() => result.current.panelProps.onClose());
  expect(result.current.placeVisits).toBe(visits);
  expect(calls).toEqual(["new"]);
});

test("background dismissal uses the same reward callback once and keeps the visit closed", () => {
  const dismissed: string[] = [];
  const { result, rerender } = renderHook(() =>
    useEntryExplorationPlacePanel(ENTRY_TEST_PLACES, {
      onDismiss: (placeId) => dismissed.push(placeId),
    })
  );
  const dismissFromBackground = result.current.dismissOpenPanel;
  act(() => {
    result.current.placeVisits[FIRST_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  act(() => {
    expect(dismissFromBackground()).toBe(true);
    expect(dismissFromBackground()).toBe(false);
  });
  expect(dismissed).toEqual([FIRST_PLACE_ID]);
  expect(result.current.panelProps.open).toBe(false);
  act(() => {
    result.current.placeVisits[FIRST_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  rerender();
  expect(result.current.panelProps.open).toBe(false);
  expect(result.current.dismissOpenPanel).toBe(dismissFromBackground);
});
