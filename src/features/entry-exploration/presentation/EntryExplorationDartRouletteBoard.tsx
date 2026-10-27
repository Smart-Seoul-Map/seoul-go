import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject,
  type SyntheticEvent,
} from "react";

import { getSelectionYearBadgeTone } from "@shared/constants/selectionYearBadge";
import { AppBadge } from "@shared/ui/badge";
import { AppBox } from "@shared/ui/box";
import { AppHStack } from "@shared/ui/layout";
import { AppText } from "@shared/ui/typography";

import type {
  EntryExplorationDartRouletteBoardState,
  EntryExplorationDartRouletteMapRectStore,
} from "../application/useEntryExplorationDartShot";
import type { EntryExplorationDartViewportRect } from "../application/entryExplorationSeoulTileMapViewInteraction";
import { ENTRY_EXPLORATION_DART_ROULETTE_CONFIG } from "../config/entryExplorationDartRouletteConfig";
import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import type { EntryNumberRewardCell } from "../domain/entryNumberReward";
import { isSeoulGridCellValid, type SeoulGridCell } from "../domain/seoulGridNumber";
import { EntryExplorationSceneButton } from "./EntryExplorationSceneButton";

import "./EntryExplorationDartRouletteBoard.css";

type EntryExplorationDartRoulettePhase = "done" | "fast" | "idle" | "slow" | "win";

type RouletteInfoBoxAlign = "center" | "end" | "start";

export type EntryExplorationDartRouletteBoardProps = {
  board: EntryExplorationDartRouletteBoardState;
  hasResult: boolean;
  isReady: boolean;
  isStarted: boolean;
  mapRectStore: EntryExplorationDartRouletteMapRectStore;
  onStart: () => void;
  visitedPlaces?: readonly EntryNumberRewardCell[];
};

const CONFETTI_PIECES = Array.from({ length: 14 }, (_, index) => index);
const EMPTY_VISITED_PLACES: readonly EntryNumberRewardCell[] = [];
const { board: boardConfig, infoBox, steps } = ENTRY_EXPLORATION_DART_ROULETTE_CONFIG;
const { hitMarker } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
const { columns, rows } = SEOUL_GRID_MAP_CONFIG;
const CELL_BEVEL_STYLE: CSSProperties = { backgroundSize: `${100 / columns}% ${100 / rows}%` };

export function EntryExplorationDartRouletteBoard({
  board,
  hasResult,
  isReady,
  isStarted,
  mapRectStore,
  onStart,
  visitedPlaces = EMPTY_VISITED_PLACES,
}: EntryExplorationDartRouletteBoardProps): ReactElement {
  const { activeCell, layout, win } = board;
  const restMapRect = layout?.restMapRect ?? null;
  const boardRef = useRef<HTMLDivElement>(null);
  const infoBoxRef = useRef<HTMLDivElement>(null);
  const cellPointerTypeRef = useRef<string | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [tappedPlaceId, setTappedPlaceId] = useState<string | null>(null);
  const phase = getRoulettePhase(board, isStarted, hasResult);
  const isWinHolding = phase === "win";
  // 점멸 중(START 후 결과 전)에는 방문 장소 정보를 열지 않는다.
  const isInfoAvailable = phase === "idle" || phase === "done";
  const infoPlaceId = isInfoAvailable ? (tappedPlaceId ?? hoveredPlaceId) : null;
  const infoPlace = visitedPlaces.find((place) => place.placeId === infoPlaceId) ?? null;

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

  // 탭으로 연 정보 박스는 박스 밖이나 다른 칸을 누르면 닫는다.
  useEffect(() => {
    if (!tappedPlaceId) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Node && infoBoxRef.current?.contains(event.target)) {
        return;
      }

      setTappedPlaceId(null);
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  }, [tappedPlaceId]);

  const handleVisitedCellPointerDown = (event: SyntheticEvent, pointerType: string): void => {
    stopSceneInput(event);
    cellPointerTypeRef.current = pointerType;
  };

  // PC 마우스 클릭은 박스를 열지 않는다(호버로만 보인다). 탭이나 키보드로 누르면 연다.
  const handleVisitedCellClick = (event: SyntheticEvent, placeId: string): void => {
    stopSceneInput(event);
    const isMouseClick = cellPointerTypeRef.current === "mouse";
    cellPointerTypeRef.current = null;

    if (!isMouseClick) {
      setTappedPlaceId(placeId);
    }
  };

  const handleVisitedCellPointerEnter = (pointerType: string, placeId: string): void => {
    if (pointerType === "mouse") {
      setHoveredPlaceId(placeId);
    }
  };

  const handleInfoClose = (): void => {
    setHoveredPlaceId(null);
    setTappedPlaceId(null);
  };

  const handleStartClick = (): void => {
    handleInfoClose();
    onStart();
  };

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
              const visitedPlace = visitedPlaces.find((place) => isSameCell(place.cell, cell));
              const pathProps = {
                className: "entry-exploration-dart-roulette__path",
                "data-lit": isLit,
                "data-ripple": isRippling,
                style: {
                  ...toCellStyle(cell, boardConfig.tileGapRatio),
                  animationDelay: getRippleDelay(winDistance),
                },
              };

              if (!visitedPlace) {
                return <span key={toCellKey(cell)} aria-hidden="true" {...pathProps} />;
              }

              return (
                <button
                  key={toCellKey(cell)}
                  type="button"
                  aria-label={`${visitedPlace.placeName} 정보 보기`}
                  data-visited="true"
                  disabled={!isInfoAvailable}
                  onClick={(event) => handleVisitedCellClick(event, visitedPlace.placeId)}
                  onPointerDown={(event) => handleVisitedCellPointerDown(event, event.pointerType)}
                  onPointerEnter={(event) =>
                    handleVisitedCellPointerEnter(event.pointerType, visitedPlace.placeId)
                  }
                  onPointerLeave={() => setHoveredPlaceId(null)}
                  onWheel={stopSceneInput}
                  {...pathProps}
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
          {win && <RouletteResultMarker cell={win.cell} />}
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
          {infoPlace && <RouletteVisitedPlaceInfo boxRef={infoBoxRef} place={infoPlace} />}
        </div>
      )}
      <EntryExplorationSceneButton
        isDisabled={isStarted}
        isVisible={isReady && !hasResult}
        onClick={handleStartClick}
        placement="bottom"
      >
        START
      </EntryExplorationSceneButton>
    </div>
  );
}

type RouletteResultMarkerProps = {
  cell: SeoulGridCell;
};

// 화살 화면의 3D 결과 마커(십자 5칸 + 링 2개)를 판 위에 같은 모양으로 그린다.
// 당첨 순간에 튀어 오르며 나타나고, 결과가 나온 뒤에도 그대로 남는다.
function RouletteResultMarker({ cell }: RouletteResultMarkerProps): ReactElement {
  const crossCells = hitMarker.cellOffsets
    .map((offset) => ({ column: cell.column + offset.column, row: cell.row + offset.row }))
    .filter(isSeoulGridCellValid);

  return (
    <span
      aria-hidden="true"
      className="entry-exploration-dart-roulette__marker"
      style={toCellOriginStyle(cell)}
    >
      {crossCells.map((crossCell) => (
        <span
          key={toCellKey(crossCell)}
          className="entry-exploration-dart-roulette__marker-cell"
          style={{ ...toCellStyle(crossCell, 0), opacity: hitMarker.cellOpacity }}
        />
      ))}
      <span
        className="entry-exploration-dart-roulette__marker-center"
        style={{ ...toCellStyle(cell, 0), borderWidth: `${(1 - hitMarker.centerScale) / 2}em` }}
      />
      <span
        className="entry-exploration-dart-roulette__marker-ring"
        style={toRingStyle(cell, hitMarker.ring.outer)}
      />
      <span
        className="entry-exploration-dart-roulette__marker-ring"
        style={toRingStyle(cell, hitMarker.ring.inner)}
      />
    </span>
  );
}

type RouletteVisitedPlaceInfoProps = {
  boxRef: RefObject<HTMLDivElement | null>;
  place: EntryNumberRewardCell;
};

// 방문 장소 칸 위에 장소명과 연도 배지를 띄운다. 연도 배지는 장소 정보 패널과 같은 색을 장소명 높이에 맞춰 작게 쓴다.
function RouletteVisitedPlaceInfo({ boxRef, place }: RouletteVisitedPlaceInfoProps): ReactElement {
  return (
    <div
      className="entry-exploration-dart-roulette__info"
      style={toCellStyle(place.cell, boardConfig.tileGapRatio)}
    >
      <AppBox
        ref={boxRef}
        bg="bg.surfacePaper"
        borderColor="stroke.brand"
        borderRadius="radius.3"
        borderWidth="strokeWidth.surface"
        boxShadow="shadow.raised"
        className="entry-exploration-dart-roulette__info-box"
        data-align={getInfoBoxAlign(place.cell)}
        px="spacing.3"
        py="spacing.2"
        onClick={stopSceneInput}
        onPointerDown={stopSceneInput}
        onWheel={stopSceneInput}
      >
        <AppHStack align="center" gap="sm">
          <AppText role="supporting">{place.placeName}</AppText>
          {place.selectionYear !== undefined && (
            <AppBadge
              size="xs"
              tone={getSelectionYearBadgeTone(place.selectionYear)}
              variant="solid"
              textPolicy="singleLine"
            >
              {place.selectionYear}
            </AppBadge>
          )}
        </AppHStack>
      </AppBox>
    </div>
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

// 판 가장자리 칸의 정보 박스는 화면 밖으로 잘리지 않게 칸의 같은 쪽 끝에 맞춘다.
function getInfoBoxAlign({ column }: SeoulGridCell): RouletteInfoBoxAlign {
  const columnRatio = (column + 0.5) / columns;

  if (columnRatio < infoBox.edgeColumnRatio) {
    return "start";
  }

  if (columnRatio > 1 - infoBox.edgeColumnRatio) {
    return "end";
  }

  return "center";
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

function toCellStyle({ column, row }: SeoulGridCell, gap: number): CSSProperties {
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

function toCellOriginStyle({ column, row }: SeoulGridCell): CSSProperties {
  return {
    transformOrigin: `${toPercent((column + 0.5) / columns)} ${toPercent((row + 0.5) / rows)}`,
  };
}

function toRingStyle(
  cell: SeoulGridCell,
  { radiusCells, widthCells }: { radiusCells: number; widthCells: number }
): CSSProperties {
  const size = `${radiusCells * 2 + widthCells}em`;

  return { ...toCellCenterStyle(cell), borderWidth: `${widthCells}em`, height: size, width: size };
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

// 판 위 버튼·정보 박스 입력이 뒤의 3D 씬으로 넘어가지 않게 막는다.
function stopSceneInput(event: SyntheticEvent): void {
  event.stopPropagation();
}
