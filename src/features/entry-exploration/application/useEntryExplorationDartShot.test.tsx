import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type {
  EntryExplorationDartRouletteLayout,
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "./entryExplorationSeoulTileMapViewInteraction";
import { useEntryExplorationDartShot } from "./useEntryExplorationDartShot";

const FIRST_CELL = { column: 3, row: 4 };
const NEXT_CELL = { column: 5, row: 4 };
const LAYOUT: EntryExplorationDartRouletteLayout = {
  mapRect: { height: 0.6, width: 0.8, x: 0.5, y: 0.5 },
  selectableCells: [FIRST_CELL, NEXT_CELL],
};
const ROULETTE_RESULT: EntryExplorationDartThrowResult = {
  cell: NEXT_CELL,
  districtId: null,
  gridNumber: "다사 5249",
  viewportPoint: { x: 0.25, y: 0.5 },
};

function createViewControls(): EntryExplorationDartViewControls {
  return {
    requestApproach: vi.fn(),
    resetThrow: vi.fn(),
    setHitCell: vi.fn(),
    startRoulette: vi.fn(() => true),
    throwAtRandomCell: vi.fn(),
  };
}

describe("useEntryExplorationDartShot", () => {
  test("tracks the roulette board and shows START again after retrying", () => {
    const controls = createViewControls();
    const win = { cell: NEXT_CELL, gridNumber: ROULETTE_RESULT.gridNumber };
    const { result } = renderHook(() => useEntryExplorationDartShot());

    act(() => {
      result.current.onRouletteViewControlsReady(controls);
      result.current.onRouletteViewActiveChange(true);
      result.current.onRouletteCameraSettled();
      result.current.onRouletteLayoutChange(LAYOUT);
    });
    act(() => result.current.onRouletteStart());
    act(() => {
      result.current.onRouletteHighlight({ cell: FIRST_CELL, step: 0 });
      result.current.onRouletteHighlight({ cell: NEXT_CELL, step: 1 });
    });

    expect(result.current.dartShot.isRouletteStarted).toBe(true);
    expect(result.current.dartShot.rouletteBoard).toEqual({
      activeCell: NEXT_CELL,
      layout: LAYOUT,
      step: 1,
      win: null,
    });

    act(() => result.current.onRouletteWin(win));

    expect(result.current.dartShot.rouletteBoard).toMatchObject({ activeCell: null, win });

    act(() => result.current.onRouletteThrowResult(ROULETTE_RESULT));

    expect(result.current.dartShot.landedResult).toBe(ROULETTE_RESULT);
    expect(controls.setHitCell).not.toHaveBeenCalled();

    act(() => result.current.onRetryThrow());

    expect(controls.resetThrow).toHaveBeenCalledOnce();
    expect(result.current.dartShot).toMatchObject({
      isRouletteReady: true,
      isRouletteStarted: false,
      rouletteBoard: { activeCell: null, layout: LAYOUT, step: 0, win: null },
      shotResult: null,
      viewKind: "roulette",
    });
  });

  test("clears the roulette board when the view closes", () => {
    const { result } = renderHook(() => useEntryExplorationDartShot());

    act(() => {
      result.current.onRouletteViewActiveChange(true);
      result.current.onRouletteLayoutChange(LAYOUT);
      result.current.onRouletteHighlight({ cell: FIRST_CELL, step: 0 });
    });
    act(() => result.current.onRouletteViewActiveChange(false));

    expect(result.current.dartShot.rouletteBoard).toEqual({
      activeCell: null,
      layout: null,
      step: 0,
      win: null,
    });
  });
});
