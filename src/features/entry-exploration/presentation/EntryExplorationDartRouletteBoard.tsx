import { useEffect, useState, type CSSProperties, type ReactElement } from "react";

import type { EntryExplorationDartRouletteBoardState } from "../application/useEntryExplorationDartShot";
import type { EntryExplorationDartViewportRect } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import type { SeoulGridCell } from "../domain/seoulGridNumber";
import { EntryExplorationSceneButton } from "./EntryExplorationSceneButton";

import "./EntryExplorationDartRouletteBoard.css";

type EntryExplorationDartRoulettePhase = "done" | "fast" | "idle" | "slow" | "win";

type EntryExplorationDartRouletteTileState = "active" | "owned" | "trail" | "win";

export type EntryExplorationDartRouletteBoardProps = {
  board: EntryExplorationDartRouletteBoardState;
  hasResult: boolean;
  isReady: boolean;
  isStarted: boolean;
  onStart: () => void;
};

const CONFETTI_PIECES = Array.from({ length: 14 }, (_, index) => index);
const { board: boardConfig, steps } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG;
const { columns, rows } = SEOUL_GRID_MAP_CONFIG;
const CELL_BEVEL_STYLE: CSSProperties = { backgroundSize: `${100 / columns}% ${100 / rows}%` };

export function EntryExplorationDartRouletteBoard({
  board,
  hasResult,
  isReady,
  isStarted,
  onStart,
}: EntryExplorationDartRouletteBoardProps): ReactElement {
  const { activeCell, layout, trailCell, win } = board;
  const hasLayout = layout !== null;
  const [isIntroPlaying, setIsIntroPlaying] = useState(true);
  const phase = getRoulettePhase(board, isStarted, hasResult);
  const isWinHolding = phase === "win";

  useEffect(() => {
    if (!hasLayout) {
      return;
    }

    const timer = setTimeout(() => setIsIntroPlaying(false), boardConfig.introDurationMs);

    return () => clearTimeout(timer);
  }, [hasLayout]);

  return (
    <div className="entry-exploration-dart-roulette" data-phase={phase}>
      {layout && (
        <div
          className="entry-exploration-dart-roulette__board"
          data-intro={isIntroPlaying}
          style={toBoardStyle(layout.mapRect)}
        >
          <div className="entry-exploration-dart-roulette__slab-depth">
            <div className="entry-exploration-dart-roulette__slab">
              <div
                className="entry-exploration-dart-roulette__slab-bevel"
                style={CELL_BEVEL_STYLE}
              />
            </div>
          </div>
          <div className="entry-exploration-dart-roulette__paths">
            {layout.selectableCells.map((cell) => {
              const winDistance = win ? getCellDistance(cell, win.cell) : null;
              const isRippling =
                isWinHolding &&
                winDistance !== null &&
                winDistance > 0 &&
                winDistance <= boardConfig.rippleRadiusCells;

              return (
                <span
                  key={toCellKey(cell)}
                  aria-hidden="true"
                  className="entry-exploration-dart-roulette__path"
                  data-ripple={isRippling}
                  style={{
                    ...toCellStyle(cell),
                    animationDelay: getPathAnimationDelay(cell, isIntroPlaying, winDistance),
                  }}
                />
              );
            })}
            {isWinHolding && win && (
              <span
                className="entry-exploration-dart-roulette__wave"
                style={toCellCenterStyle(win.cell)}
              />
            )}
          </div>
          {trailCell && (
            <RouletteTile key={`trail:${toCellKey(trailCell)}`} cell={trailCell} state="trail" />
          )}
          {activeCell && (
            <RouletteTile
              key={`active:${toCellKey(activeCell)}`}
              cell={activeCell}
              state="active"
            />
          )}
          {win && <RouletteTile cell={win.cell} state={isWinHolding ? "win" : "owned"} />}
          {isWinHolding && win && (
            <>
              <span
                className="entry-exploration-dart-roulette__flash"
                style={toCellCenterStyle(win.cell)}
              />
              <span
                className="entry-exploration-dart-roulette__confetti"
                style={toCellCenterStyle(win.cell)}
              >
                {CONFETTI_PIECES.map((piece) => (
                  <i key={piece} />
                ))}
              </span>
            </>
          )}
        </div>
      )}
      <EntryExplorationSceneButton
        isDisabled={isStarted}
        isVisible={isReady && !hasResult}
        onClick={onStart}
        placement="bottom"
      >
        START
      </EntryExplorationSceneButton>
    </div>
  );
}

type RouletteTileProps = {
  cell: SeoulGridCell;
  state: EntryExplorationDartRouletteTileState;
};

function RouletteTile({ cell, state }: RouletteTileProps): ReactElement {
  const hasStamp = state === "owned" || state === "win";

  return (
    <span
      aria-hidden="true"
      className="entry-exploration-dart-roulette__tile"
      data-state={state}
      style={toCellStyle(cell)}
    >
      {hasStamp && <span className="entry-exploration-dart-roulette__stamp">⚑</span>}
    </span>
  );
}

function getRoulettePhase(
  board: EntryExplorationDartRouletteBoardState,
  isStarted: boolean,
  hasResult: boolean
): EntryExplorationDartRoulettePhase {
  if (board.win) {
    return hasResult ? "done" : "win";
  }

  if (!isStarted) {
    return "idle";
  }

  return board.step >= steps.fastCount ? "slow" : "fast";
}

function getPathAnimationDelay(
  cell: SeoulGridCell,
  isIntroPlaying: boolean,
  winDistance: number | null
): string | undefined {
  if (isIntroPlaying) {
    const centerDistance = Math.hypot(cell.column + 0.5 - columns / 2, cell.row + 0.5 - rows / 2);

    return `${Math.round(centerDistance * boardConfig.introDelayPerCellMs)}ms`;
  }

  if (winDistance === null) {
    return undefined;
  }

  return `${Math.round(winDistance * boardConfig.rippleDelayPerCellMs)}ms`;
}

function toBoardStyle({ height, width, x, y }: EntryExplorationDartViewportRect): CSSProperties {
  return {
    fontSize: `${(width / columns) * 100}cqw`,
    height: toPercent(height),
    left: toPercent(x - width / 2),
    top: toPercent(y - height / 2),
    width: toPercent(width),
  };
}

function toCellStyle({ column, row }: SeoulGridCell): CSSProperties {
  const gap = boardConfig.tileGapRatio;

  return {
    height: toPercent((1 - gap) / rows),
    left: toPercent((column + gap / 2) / columns),
    top: toPercent((row + gap / 2) / rows),
    width: toPercent((1 - gap) / columns),
  };
}

function toCellCenterStyle({ column, row }: SeoulGridCell): CSSProperties {
  return {
    left: toPercent((column + 0.5) / columns),
    top: toPercent((row + 0.5) / rows),
  };
}

function toPercent(ratio: number): string {
  return `${ratio * 100}%`;
}

function toCellKey({ column, row }: SeoulGridCell): string {
  return `${column}:${row}`;
}

function getCellDistance(from: SeoulGridCell, to: SeoulGridCell): number {
  return Math.hypot(from.column - to.column, from.row - to.row);
}
