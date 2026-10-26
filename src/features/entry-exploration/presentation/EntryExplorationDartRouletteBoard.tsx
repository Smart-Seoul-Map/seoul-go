import { useLayoutEffect, useRef, type CSSProperties, type ReactElement } from "react";

import type {
  EntryExplorationDartRouletteBoardState,
  EntryExplorationDartRouletteMapRectStore,
} from "../application/useEntryExplorationDartShot";
import type { EntryExplorationDartViewportRect } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import type { SeoulGridCell } from "../domain/seoulGridNumber";
import { EntryExplorationSceneButton } from "./EntryExplorationSceneButton";

import "./EntryExplorationDartRouletteBoard.css";

type EntryExplorationDartRoulettePhase = "done" | "fast" | "idle" | "slow" | "win";

type EntryExplorationDartRouletteTileState = "owned" | "win";

export type EntryExplorationDartRouletteBoardProps = {
  board: EntryExplorationDartRouletteBoardState;
  hasResult: boolean;
  isReady: boolean;
  isStarted: boolean;
  mapRectStore: EntryExplorationDartRouletteMapRectStore;
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
  mapRectStore,
  onStart,
}: EntryExplorationDartRouletteBoardProps): ReactElement {
  const { activeCell, layout, win } = board;
  const restMapRect = layout?.restMapRect ?? null;
  const boardRef = useRef<HTMLDivElement>(null);
  const phase = getRoulettePhase(board, isStarted, hasResult);
  const isWinHolding = phase === "win";

  // 판은 도착 위치 크기로 한 번 그리고, 카메라 이동 중에는 transform만 바꿔서 다시 그리지 않는다.
  useLayoutEffect(() => {
    if (!restMapRect) {
      return;
    }

    const followMap = (mapRect: EntryExplorationDartViewportRect): void => {
      boardRef.current?.style.setProperty("transform", toFollowTransform(mapRect, restMapRect));
    };
    const mapRect = mapRectStore.getSnapshot();

    if (mapRect) {
      followMap(mapRect);
    }

    return mapRectStore.subscribe(followMap);
  }, [mapRectStore, restMapRect]);

  return (
    <div className="entry-exploration-dart-roulette" data-phase={phase}>
      {layout && (
        <div
          ref={boardRef}
          className="entry-exploration-dart-roulette__board"
          style={toBoardStyle(layout.restMapRect)}
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
              const isLit = activeCell !== null && isSameCell(cell, activeCell);
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
                  data-lit={isLit}
                  data-ripple={isRippling}
                  style={{
                    ...toCellStyle(cell),
                    animationDelay: getRippleDelay(winDistance),
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
  return (
    <span
      aria-hidden="true"
      className="entry-exploration-dart-roulette__tile"
      data-state={state}
      style={toCellStyle(cell)}
    >
      <span className="entry-exploration-dart-roulette__stamp">⚑</span>
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

function getRippleDelay(winDistance: number | null): string | undefined {
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

function toFollowTransform(
  mapRect: EntryExplorationDartViewportRect,
  restMapRect: EntryExplorationDartViewportRect
): string {
  const translateX = (getRectLeft(mapRect) - getRectLeft(restMapRect)) / restMapRect.width;
  const translateY = (getRectTop(mapRect) - getRectTop(restMapRect)) / restMapRect.height;
  const scaleX = mapRect.width / restMapRect.width;
  const scaleY = mapRect.height / restMapRect.height;
  const translate = `translate(${toPercent(translateX)}, ${toPercent(translateY)})`;

  return `${translate} scale(${scaleX}, ${scaleY})`;
}

function getRectLeft({ width, x }: EntryExplorationDartViewportRect): number {
  return x - width / 2;
}

function getRectTop({ height, y }: EntryExplorationDartViewportRect): number {
  return y - height / 2;
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

function isSameCell(left: SeoulGridCell, right: SeoulGridCell): boolean {
  return left.column === right.column && left.row === right.row;
}

function getCellDistance(from: SeoulGridCell, to: SeoulGridCell): number {
  return Math.hypot(from.column - to.column, from.row - to.row);
}
