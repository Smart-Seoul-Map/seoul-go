import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import type {
  EntryExplorationDartRouletteBoardState,
  EntryExplorationDartRouletteMapRectStore,
} from "../application/useEntryExplorationDartShot";
import type { EntryExplorationDartViewportRect } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import { getSeoulGridSelectableCells } from "../domain/seoulGridNumberLines";
import {
  EntryExplorationDartRouletteBoard,
  type EntryExplorationDartRouletteBoardProps,
} from "./EntryExplorationDartRouletteBoard";

const SELECTABLE_CELLS = getSeoulGridSelectableCells([52]);
const [FIRST_CELL] = SELECTABLE_CELLS;
const REST_MAP_RECT = { height: 0.5, width: 0.75, x: 0.5, y: 0.5 };
const READY_BOARD: EntryExplorationDartRouletteBoardState = {
  activeCell: null,
  layout: { restMapRect: REST_MAP_RECT, selectableCells: SELECTABLE_CELLS },
  step: 0,
  win: null,
};
const WON_BOARD: EntryExplorationDartRouletteBoardState = {
  ...READY_BOARD,
  step: ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.steps.count - 1,
  win: { cell: FIRST_CELL, gridNumber: "다사 5249" },
};

afterEach(cleanup);

function createMapRectStore() {
  const listeners = new Set<(mapRect: EntryExplorationDartViewportRect) => void>();
  let snapshot: EntryExplorationDartViewportRect = REST_MAP_RECT;
  const store: EntryExplorationDartRouletteMapRectStore = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };

  return {
    moveMap: (mapRect: EntryExplorationDartViewportRect) => {
      snapshot = mapRect;
      listeners.forEach((listener) => listener(mapRect));
    },
    store,
  };
}

const STILL_MAP_RECT_STORE = createMapRectStore().store;

function renderBoard(props: Partial<EntryExplorationDartRouletteBoardProps> = {}) {
  return render(
    <EntryExplorationDartRouletteBoard
      board={READY_BOARD}
      hasResult={false}
      isReady
      isStarted={false}
      mapRectStore={STILL_MAP_RECT_STORE}
      onStart={vi.fn()}
      {...props}
    />
  );
}

function getRoot(container: HTMLElement): Element {
  return container.querySelector(".entry-exploration-dart-roulette")!;
}

describe("EntryExplorationDartRouletteBoard", () => {
  test("raises the map slab and its number line tiles", () => {
    const onStart = vi.fn();
    const { container } = renderBoard({ onStart });

    expect(container.querySelector(".entry-exploration-dart-roulette__slab")).not.toBeNull();
    expect(container.querySelectorAll(".entry-exploration-dart-roulette__path")).toHaveLength(
      SELECTABLE_CELLS.length
    );
    expect(getRoot(container)).toHaveAttribute("data-phase", "idle");

    fireEvent.click(screen.getByRole("button", { name: "START" }));

    expect(onStart).toHaveBeenCalledOnce();
  });

  test("follows the moving map with a transform without resizing the slab", () => {
    const { moveMap, store } = createMapRectStore();
    const { container } = renderBoard({ mapRectStore: store });
    const tileBoard = container.querySelector<HTMLElement>(
      ".entry-exploration-dart-roulette__board"
    )!;

    expect(tileBoard).toHaveStyle({ height: "50%", left: "12.5%", top: "25%", width: "75%" });
    expect(tileBoard.style.transform).toBe("translate(0%, 0%) scale(1, 1)");

    act(() => moveMap({ height: 0.25, width: 0.375, x: 0.5, y: 0.5 }));

    expect(tileBoard.style.transform).toBe("translate(25%, 25%) scale(0.5, 0.5)");
    expect(tileBoard).toHaveStyle({ width: "75%" });
  });

  test("lights the current cell in place and deepens the glow in the slow steps", () => {
    const { container, rerender } = renderBoard({
      board: { ...READY_BOARD, activeCell: FIRST_CELL },
      isStarted: true,
    });
    const litPaths = container.querySelectorAll('[data-lit="true"]');

    expect(litPaths).toHaveLength(1);
    expect(litPaths[0]).toHaveClass("entry-exploration-dart-roulette__path");
    expect(container.querySelector(".entry-exploration-dart-roulette__tile")).toBeNull();
    expect(getRoot(container)).toHaveAttribute("data-phase", "fast");
    expect(screen.getByRole("button", { name: "START" })).toBeDisabled();

    rerender(
      <EntryExplorationDartRouletteBoard
        board={{
          ...READY_BOARD,
          activeCell: FIRST_CELL,
          step: ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.steps.fastCount,
        }}
        hasResult={false}
        isReady
        isStarted
        mapRectStore={STILL_MAP_RECT_STORE}
        onStart={vi.fn()}
      />
    );

    expect(getRoot(container)).toHaveAttribute("data-phase", "slow");
  });

  test("celebrates the winner and stamps it after the result arrives", () => {
    const { container, rerender } = renderBoard({ board: WON_BOARD, isStarted: true });

    expect(getRoot(container)).toHaveAttribute("data-phase", "win");
    expect(screen.queryByText(/구역 점령 성공/)).toBeNull();
    expect(container.querySelector('[data-state="win"]')).toHaveTextContent("⚑");
    expect(container.querySelectorAll('[data-ripple="true"]').length).toBeGreaterThan(0);
    expect(container.querySelector(".entry-exploration-dart-roulette__wave")).not.toBeNull();
    expect(container.querySelector(".entry-exploration-dart-roulette__flash")).not.toBeNull();
    expect(container.querySelectorAll(".entry-exploration-dart-roulette__confetti i")).toHaveLength(
      14
    );

    rerender(
      <EntryExplorationDartRouletteBoard
        board={WON_BOARD}
        hasResult
        isReady
        isStarted={false}
        mapRectStore={STILL_MAP_RECT_STORE}
        onStart={vi.fn()}
      />
    );

    expect(getRoot(container)).toHaveAttribute("data-phase", "done");
    expect(container.querySelector('[data-state="owned"]')).toHaveTextContent("⚑");
    expect(container.querySelector('[data-ripple="true"]')).toBeNull();
    expect(container.querySelector(".entry-exploration-dart-roulette__flash")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
