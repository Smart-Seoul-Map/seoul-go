import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { EntryExplorationDartRouletteBoardState } from "../application/useEntryExplorationDartShot";
import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import { getSeoulGridSelectableCells } from "../domain/seoulGridNumberLines";
import {
  EntryExplorationDartRouletteBoard,
  type EntryExplorationDartRouletteBoardProps,
} from "./EntryExplorationDartRouletteBoard";

const SELECTABLE_CELLS = getSeoulGridSelectableCells([52]);
const [FIRST_CELL] = SELECTABLE_CELLS;
const READY_BOARD: EntryExplorationDartRouletteBoardState = {
  activeCell: null,
  layout: {
    mapRect: { height: 0.62, width: 0.76, x: 0.5, y: 0.5 },
    selectableCells: SELECTABLE_CELLS,
  },
  step: 0,
  trailCell: null,
  win: null,
};
const WON_BOARD: EntryExplorationDartRouletteBoardState = {
  ...READY_BOARD,
  step: ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.steps.count - 1,
  win: { cell: FIRST_CELL, gridNumber: "다사 5249" },
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderBoard(props: Partial<EntryExplorationDartRouletteBoardProps> = {}) {
  return render(
    <EntryExplorationDartRouletteBoard
      board={READY_BOARD}
      hasResult={false}
      isReady
      isStarted={false}
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

  test("finishes the intro wave after it plays", () => {
    vi.useFakeTimers();

    const { container } = renderBoard();
    const tileBoard = container.querySelector(".entry-exploration-dart-roulette__board");

    expect(tileBoard).toHaveAttribute("data-intro", "true");

    act(() => {
      vi.advanceTimersByTime(ENTRY_EXPLORATION_DART_ROULETTE_CONFIG.board.introDurationMs);
    });

    expect(tileBoard).toHaveAttribute("data-intro", "false");
  });

  test("lifts the current cell and builds tension in the slow steps", () => {
    const [, secondCell] = SELECTABLE_CELLS;
    const { container, rerender } = renderBoard({
      board: { ...READY_BOARD, activeCell: secondCell, trailCell: FIRST_CELL },
      isStarted: true,
    });

    expect(container.querySelectorAll('[data-state="active"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-state="trail"]')).toHaveLength(1);
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
