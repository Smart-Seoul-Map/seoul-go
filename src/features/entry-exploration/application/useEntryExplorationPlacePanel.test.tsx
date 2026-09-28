import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";

import { useEntryExplorationPlacePanel } from "./useEntryExplorationPlacePanel";
import { createEntryNumberRewardStore } from "./entryNumberRewardStore";

test("awards on arrival but starts presentation only on explicit card dismissal", () => {
  const store = createEntryNumberRewardStore({ storage: null, random: () => 0 });
  const dismissed: string[] = [];
  const { result } = renderHook(() =>
    useEntryExplorationPlacePanel({
      onVisit: store.getState().visitPlace,
      onDismiss: (placeId) => {
        dismissed.push(placeId);
      },
    })
  );
  act(() => {
    result.current.placeVisits.hanok.update({ x: 10, z: 20 }, { x: 10, z: 20 });
  });
  expect(result.current.panelProps.open).toBe(true);
  expect(store.getState().rewards).toEqual([{ placeId: "hanok", number: 36, revealed: false }]);
  act(() => {
    result.current.placeVisits.hanok.dismiss();
  });
  expect(dismissed).toEqual([]);
  act(() => {
    result.current.placeVisits.hanok.update({ x: 30, z: 20 }, { x: 10, z: 20 });
    result.current.placeVisits.hanok.update({ x: 10, z: 20 }, { x: 10, z: 20 });
  });
  act(() => result.current.panelProps.onClose());
  expect(dismissed).toEqual(["hanok"]);
  expect(store.getState().rewards).toHaveLength(1);
});

test("does not recreate place visit controllers when callbacks change", () => {
  const { result, rerender } = renderHook(
    ({ label }) =>
      useEntryExplorationPlacePanel({
        onDismiss: () => {
          calls.push(label);
        },
      }),
    { initialProps: { label: "old" } }
  );
  const calls: string[] = [];
  const visits = result.current.placeVisits;
  act(() => {
    visits.tower.update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  rerender({ label: "new" });
  act(() => result.current.panelProps.onClose());
  expect(result.current.placeVisits).toBe(visits);
  expect(calls).toEqual(["new"]);
});

test("background dismissal uses the same reward callback once and keeps the visit closed", () => {
  const dismissed: string[] = [];
  const { result, rerender } = renderHook(() =>
    useEntryExplorationPlacePanel({ onDismiss: (placeId) => dismissed.push(placeId) })
  );
  const dismissFromBackground = result.current.dismissOpenPanel;
  act(() => {
    result.current.placeVisits.hanok.update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  act(() => {
    expect(dismissFromBackground()).toBe(true);
    expect(dismissFromBackground()).toBe(false);
  });
  expect(dismissed).toEqual(["hanok"]);
  expect(result.current.panelProps.open).toBe(false);
  act(() => {
    result.current.placeVisits.hanok.update({ x: 0, z: 0 }, { x: 0, z: 0 });
  });
  rerender();
  expect(result.current.panelProps.open).toBe(false);
  expect(result.current.dismissOpenPanel).toBe(dismissFromBackground);
});
